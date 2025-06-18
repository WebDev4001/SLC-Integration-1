const express = require('express');
const bcrypt = require('bcryptjs'); // Though hashing is in model, comparison might be used here if not careful
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Basic validation
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

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
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
            user.deviceInfo.push({ ip, userAgent });
            // Limit the array size if desired, e.g., user.deviceInfo = user.deviceInfo.slice(-5);
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

module.exports = router;
