const express = require('express');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

// Protect all admin routes: verify token and ensure user is admin
router.use(verifyToken);
router.use(checkRole(['admin'])); // Only users with the 'admin' role can access these routes

// GET /api/admin/users - View list of all users and their roles, optionally filter by role
router.get('/users', async (req, res) => {
    try {
        const { role } = req.query;
        let query = {};
        if (role) {
            // Validate role against schema enum if necessary, though find will just return empty if role is invalid
            const allowedRoles = User.schema.path('role').enumValues;
            if (allowedRoles.includes(role)) {
                query.role = role;
            } else {
                return res.status(400).json({ message: `Invalid role filter. Allowed roles are: ${allowedRoles.join(', ')}` });
            }
        }
        // Exclude password field from the result
        const users = await User.find(query).select('-password deviceInfo.ip'); // Also hiding IP from general list view for privacy
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error when fetching users.');
    }
});

// --- Statistics Overview ---
// GET /api/admin/statistics - Get overview statistics
router.get('/statistics', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const adminUsers = await User.countDocuments({ role: 'admin' });
        const editorUsers = await User.countDocuments({ role: 'editor' });
        const viewerUsers = await User.countDocuments({ role: 'viewer' });

        const totalSuggestions = await Suggestion.countDocuments();
        const pendingSuggestions = await Suggestion.countDocuments({ status: 'pending' });

        const totalApplications = await Application.countDocuments();
        const submittedApplications = await Application.countDocuments({ status: 'submitted' });

        const totalFeedback = await Feedback.countDocuments();
        const newFeedback = await Feedback.countDocuments({ status: 'new' });

        // Could add more: e.g. counts by date ranges, most active users etc.
        // For now, basic counts.

        res.json({
            users: {
                total: totalUsers,
                admins: adminUsers,
                editors: editorUsers,
                viewers: viewerUsers
            },
            suggestions: {
                total: totalSuggestions,
                pending: pendingSuggestions
            },
            applications: {
                total: totalApplications,
                submitted: submittedApplications // or 'pending review' etc.
            },
            feedback: {
                total: totalFeedback,
                new: newFeedback
            }
        });

    } catch (err) {
        console.error('Statistics fetching error:', err.message);
        res.status(500).send('Server error when fetching statistics.');
    }
});

// GET /api/admin/users/:userId - Get details for a single user, including full deviceInfo
router.get('/users/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user); // deviceInfo is included by default if not excluded
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        res.status(500).send('Server error when fetching user details.');
    }
});

// PATCH /api/admin/update-role - Update a user's role
router.patch('/update-role', async (req, res) => {
    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
        return res.status(400).json({ message: 'User ID and new role are required.' });
    }

    // Optional: Validate newRole against the schema's enum
    const allowedRoles = User.schema.path('role').enumValues;
    if (!allowedRoles.includes(newRole)) {
        return res.status(400).json({ message: `Invalid role. Allowed roles are: ${allowedRoles.join(', ')}` });
    }

    // Prevent admin from changing their own role accidentally via this route
    // They should use a different mechanism or be aware if they are changing their own role.
    if (req.user.id === userId && req.user.role === 'admin' && newRole !== 'admin') {
        return res.status(400).json({ message: 'Admins cannot change their own role to a non-admin role through this endpoint.' });
    }


    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.role = newRole;
        await user.save();

        // Return updated user, excluding password
        const updatedUser = user.toObject();
        delete updatedUser.password;

        res.json({ message: 'User role updated successfully.', user: updatedUser });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error when updating user role.');
    }
});

// DELETE /api/admin/users/:userId - Remove access (delete user)
router.delete('/users/:userId', async (req, res) => {
    const { userId } = req.params;

    if (req.user.id === userId) {
        return res.status(400).json({ message: 'Admins cannot delete their own account through this endpoint.' });
    }

    try {
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User removed successfully.' });
    } catch (err) {
        console.error(err.message);
        // Handle potential errors, e.g., invalid ObjectId format for userId
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        res.status(500).send('Server error when removing user.');
    }
});

// GET /api/admin/logs - Export logs of activity and device info
router.get('/logs', async (req, res) => {
    try {
        // Fetch all users and select only name, email, role, and deviceInfo
        const usersWithLogs = await User.find().select('name email role deviceInfo');

        // We can return this as JSON. CSV export would require a library or more complex formatting.
        res.json(usersWithLogs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error when fetching logs.');
    }
});

// GET /api/admin/logs/csv - Export logs of activity and device info as CSV
router.get('/logs/csv', async (req, res) => {
    try {
        const usersWithLogs = await User.find().select('name email role deviceInfo createdAt updatedAt');

        let csv = 'UserID,Name,Email,Role,DeviceIP,DeviceUserAgent,DeviceDate,UserCreatedAt,UserUpdatedAt\n';

        usersWithLogs.forEach(user => {
            const userId = user._id;
            const userName = `"${user.name.replace(/"/g, '""')}"`; // Escape double quotes
            const userEmail = user.email;
            const userRole = user.role;
            const userCreatedAt = user.createdAt ? user.createdAt.toISOString() : '';
            const userUpdatedAt = user.updatedAt ? user.updatedAt.toISOString() : '';

            if (user.deviceInfo && user.deviceInfo.length > 0) {
                user.deviceInfo.forEach(device => {
                    const deviceIP = device.ip || '';
                    const deviceUserAgent = device.userAgent ? `"${device.userAgent.replace(/"/g, '""')}"` : '';
                    const deviceDate = device.date ? device.date.toISOString() : '';
                    csv += `${userId},${userName},${userEmail},${userRole},${deviceIP},${deviceUserAgent},${deviceDate},${userCreatedAt},${userUpdatedAt}\n`;
                });
            } else {
                // User with no device info
                csv += `${userId},${userName},${userEmail},${userRole},,,,${userCreatedAt},${userUpdatedAt}\n`;
            }
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('user_logs.csv');
        res.send(csv);

    } catch (err) {
        console.error('CSV Log Export error:', err.message);
        res.status(500).send('Server error during CSV log export.');
    }
});

// Import submission models
const Suggestion = require('../models/Suggestion');
const Application = require('../models/Application');
const Feedback = require('../models/Feedback');

// --- Suggestions Management ---
// GET /api/admin/suggestions - List all suggestions (can add query params for status filtering)
router.get('/suggestions', async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) {
            query.status = status;
        }
        const suggestions = await Suggestion.find(query).populate('submittedBy', 'name email').sort({ createdAt: -1 });
        res.json(suggestions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error when fetching suggestions.');
    }
});

// PATCH /api/admin/suggestions/:suggestionId/status - Update suggestion status
router.patch('/suggestions/:suggestionId/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'Status is required.' });
        }
        // Optional: Validate status against schema enum
        const allowedStatuses = Suggestion.schema.path('status').enumValues;
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
        }

        const suggestion = await Suggestion.findByIdAndUpdate(
            req.params.suggestionId,
            { status },
            { new: true }
        );
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found.' });
        }
        res.json(suggestion);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid suggestion ID format.' });
        }
        res.status(500).send('Server error updating suggestion status.');
    }
});

// --- Applications Management ---
// GET /api/admin/applications - List all applications
router.get('/applications', async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) {
            query.status = status;
        }
        const applications = await Application.find(query).populate('submittedBy', 'name email').sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error when fetching applications.');
    }
});

// PATCH /api/admin/applications/:applicationId/status - Update application status
router.patch('/applications/:applicationId/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'Status is required.' });
        }
        const allowedStatuses = Application.schema.path('status').enumValues;
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
        }

        const application = await Application.findByIdAndUpdate(
            req.params.applicationId,
            { status },
            { new: true }
        );
        if (!application) {
            return res.status(404).json({ message: 'Application not found.' });
        }
        res.json(application);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid application ID format.' });
        }
        res.status(500).send('Server error updating application status.');
    }
});

// --- Feedback Management ---
// GET /api/admin/feedback - List all feedback
router.get('/feedback', async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) {
            query.status = status;
        }
        const feedbackItems = await Feedback.find(query).populate('submittedBy', 'name email').sort({ createdAt: -1 });
        res.json(feedbackItems);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error when fetching feedback.');
    }
});

// PATCH /api/admin/feedback/:feedbackId/status - Update feedback status
router.patch('/feedback/:feedbackId/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'Status is required.' });
        }
        const allowedStatuses = Feedback.schema.path('status').enumValues;
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
        }

        const feedbackItem = await Feedback.findByIdAndUpdate(
            req.params.feedbackId,
            { status },
            { new: true }
        );
        if (!feedbackItem) {
            return res.status(404).json({ message: 'Feedback not found.' });
        }
        res.json(feedbackItem);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid feedback ID format.' });
        }
        res.status(500).send('Server error updating feedback status.');
    }
});

module.exports = router;
