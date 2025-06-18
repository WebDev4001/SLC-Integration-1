const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    rollNumber: { type: String, required: true },
    branchYear: { type: String, required: true },
    motivation: { type: String, required: true },
    resumePath: String, // Path to uploaded resume
    submittedBy: { // Optional: if user is logged in and submits for themselves
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', ApplicationSchema);
