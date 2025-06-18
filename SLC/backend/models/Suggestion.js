const mongoose = require('mongoose');

const SuggestionSchema = new mongoose.Schema({
    resourceType: { type: String, required: true },
    title: { type: String, required: true },
    author: String, // Optional
    reason: String, // Optional
    isAnonymous: { type: Boolean, default: false },
    filePath: String, // Path to uploaded supporting document
    submittedBy: { // Optional: if user is logged in
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Suggestion', SuggestionSchema);
