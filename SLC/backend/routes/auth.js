const express = require('express');
const bcrypt = require('bcryptjs'); // Though hashing is in model, comparison might be used here if not careful
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    // TODO: Add express-validator checks here, for example:
    // const { check, validationResult } = require('express-validator');
    // await check('name').not().isEmpty().withMessage('Name is required').run(req);
    // await check('email').isEmail().withMessage('Please include a valid email').run(req);
    // await check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').run(req);
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() });
    // }

    const { name, email, password } = req.body;

    // Basic validation (can be removed if express-validator is fully implemented)
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Create new user instance (password will be hashed by pre-save hook)
        user = new User({
            name,
            email,
            password,
            // role defaults to 'viewer' as per schema
        });

        await user.save();

        // Generate JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' }, // Token expiration
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    token,
                    user: { id: user.id, name: user.name, email: user.email, role: user.role }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error during registration.');
    }
});

// POST /api/auth/google - Google Sign-In
router.post('/google', async (req, res) => {
    const { id_token } = req.body;

    if (!id_token) {
        return res.status(400).json({ message: 'ID token is required.' });
    }

    try {
        // Verify the ID token with Google
        const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${id_token}`);

        if (!googleResponse.ok) {
            const errorData = await googleResponse.json().catch(() => ({ message: 'Invalid Google token or failed to parse error response.' }));
            console.error('Google token verification failed:', googleResponse.status, errorData);
            return res.status(401).json({ message: 'Invalid Google token.', details: errorData.error_description || errorData.message });
        }

        const googleUser = await googleResponse.json();

        // Check if the token is for your app (optional but recommended if you have an AUDIENCE value)
        // if (googleUser.aud !== process.env.GOOGLE_CLIENT_ID) {
        //     return res.status(401).json({ message: 'Token not intended for this application.' });
        // }

        let user = await User.findOne({ $or: [{ email: googleUser.email }, { googleId: googleUser.sub }] });

        if (user) {
            // User exists, log them in
            if (!user.googleId && googleUser.sub) { // If existing local user logs in via Google, link account
                user.googleId = googleUser.sub;
            }
            // Ensure name is updated if it changed in Google profile (optional)
            if (user.name !== googleUser.name && googleUser.name) {
                user.name = googleUser.name;
            }
            // Clear password if they are now a Google-only user (optional, depends on strategy)
            // if (user.password && user.googleId) user.password = undefined;


            // Record deviceInfo
            const ip = req.ip || req.connection?.remoteAddress;
            const userAgent = req.headers['user-agent'];
            if (ip && userAgent) {
                user.deviceInfo.push({ ip, userAgent, date: new Date() });
                if (user.deviceInfo.length > 5) {
                    user.deviceInfo = user.deviceInfo.slice(-5);
                }
            }
            await user.save();

            const payload = { user: { id: user.id, role: user.role } };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: { id: user.id, name: user.name, email: user.email, role: user.role }
                });
            });
        } else {
            // New user: signal frontend to ask for Roll Number
            res.status(200).json({
                isNewUser: true,
                email: googleUser.email,
                name: googleUser.name,
                googleId: googleUser.sub // Send googleId (sub) back to be used when creating the account
            });
        }
    } catch (err) {
        console.error('Google Sign-In error:', err.message);
        res.status(500).send('Server error during Google Sign-In.');
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    // TODO: Add express-validator checks here, for example:
    // const { check, validationResult } = require('express-validator');
    // await check('email').isEmail().withMessage('Please include a valid email').run(req);
    // await check('password').exists().withMessage('Password is required').run(req);
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() });
    // }

    const { email, password } = req.body;

    // Basic validation (can be removed if express-validator is fully implemented)
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Optionally, record deviceInfo
        const ip = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        if (ip && userAgent) {
            user.deviceInfo.push({ ip, userAgent, date: new Date() }); // Added date explicitly
            if (user.deviceInfo.length > 5) {
                user.deviceInfo = user.deviceInfo.slice(-5); // Keep only the last 5 entries
            }
            await user.save(); // Save the user with new device info
        }


        // Generate JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: { id: user.id, name: user.name, email: user.email, role: user.role }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error during login.');
    }
});

// PATCH /api/auth/add-roll-number - For new Google users to add their roll number and complete registration
router.patch('/add-roll-number', async (req, res) => {
    const { email, name, googleId, rollNumber } = req.body;

    if (!email || !name || !googleId || !rollNumber) {
        return res.status(400).json({ message: 'Email, name, Google ID, and Roll Number are required.' });
    }

    // Validate Roll Number format (20XXXXXXX)
    if (!/^20\d{7}$/.test(rollNumber)) {
        return res.status(400).json({ message: 'Invalid Roll Number format. Must be 20XXXXXXX.' });
    }

    try {
        // Check if user already exists with this email or googleId or rollNumber
        let existingUser = await User.findOne({ $or: [{ email }, { googleId }, { rollNumber }] });
        if (existingUser) {
            if (existingUser.googleId === googleId && existingUser.rollNumber === rollNumber) {
                // This scenario means they somehow hit this route again after successful registration. Log them in.
            } else if (existingUser.email === email && existingUser.googleId && existingUser.googleId !== googleId) {
                return res.status(400).json({ message: 'Email is already associated with a different Google account.' });
            } else if (existingUser.rollNumber === rollNumber) {
                 return res.status(400).json({ message: 'This Roll Number is already registered.' });
            } else if (existingUser.googleId === googleId) {
                 return res.status(400).json({ message: 'This Google account is already registered.' });
            } else {
                // Other conflict (e.g. email exists for a non-Google account)
                return res.status(400).json({ message: 'User account conflict. Please contact support.' });
            }
        }

        // If we are here, it's a new user registration completion for Google Sign-In
        const user = new User({
            name,
            email,
            googleId,
            rollNumber,
            role: 'viewer' // Default role
            // Password is not set, relying on model's conditional requirement
        });

        await user.save();

        // Record deviceInfo (optional for this step, but good practice)
        const ip = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        if (ip && userAgent) {
            user.deviceInfo.push({ ip, userAgent, date: new Date() });
            if (user.deviceInfo.length > 5) { // Ensure limit is maintained
                user.deviceInfo = user.deviceInfo.slice(-5);
            }
            await user.save();
        }

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role, rollNumber: user.rollNumber }
            });
        });

    } catch (err) {
        console.error('Add Roll Number error:', err.message);
        if (err.code === 11000) { // Duplicate key error
             if (err.keyPattern && err.keyPattern.rollNumber) {
                return res.status(400).json({ message: 'This Roll Number is already registered.' });
            } else if (err.keyPattern && err.keyPattern.googleId) {
                return res.status(400).json({ message: 'This Google account is already registered.' });
            } else if (err.keyPattern && err.keyPattern.email) {
                 return res.status(400).json({ message: 'This email is already registered.' });
            }
        }
        res.status(500).send('Server error during account finalization.');
    }
});


module.exports = router;
