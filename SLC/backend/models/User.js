const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const deviceInfoSchema = new mongoose.Schema({
    ip: { type: String },
    userAgent: { type: String },
    date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['viewer', 'editor', 'admin'],
        default: 'viewer'
    },
    rollNumber: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined values for non-Google users while enforcing uniqueness for those who have it
        match: [/^20\d{7}$/, 'Invalid Roll Number format. Must be 20XXXXXXX.'] // Matches '20' followed by 7 digits
    },
    googleId: { // To store Google's unique user ID, useful for linking
        type: String,
        unique: true,
        sparse: true
    },
    deviceInfo: [deviceInfoSchema]
}, { timestamps: true });

// Pre-save hook to hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
