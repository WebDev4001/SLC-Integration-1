const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    name: String, // Optional
    email: String, // Optional
    subject: { type: String, required: true },
    message: { type: String, required: true },
    submittedBy: { // Optional: if user is logged in
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
