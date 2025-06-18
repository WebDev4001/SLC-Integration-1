const express = require('express');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

// Protect all admin routes: verify token and ensure user is admin
router.use(verifyToken);
router.use(checkRole(['admin'])); // Only users with the 'admin' role can access these routes

// GET /api/admin/users - View list of all users and their roles
router.get('/users', async (req, res) => {
    try {
        // Exclude password field from the result
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error when fetching users.');
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

module.exports = router;
