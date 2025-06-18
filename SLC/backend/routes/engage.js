const express = require('express');
const multer = require('multer');
const path = require('path');
const Suggestion = require('../models/Suggestion');
const Application = require('../models/Application');
const Feedback = require('../models/Feedback');
const verifyToken = require('../middleware/verifyToken'); // Optional: to associate submissions with users

const router = express.Router();

// Multer setup for suggestion attachments
const suggestionStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/suggestions/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const uploadSuggestion = multer({ storage: suggestionStorage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Multer setup for resumes
const resumeStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/resumes/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const uploadResume = multer({
    storage: resumeStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed for resumes.'), false);
        }
    }
});

// POST /api/engage/suggest - Handles book/resource suggestions
router.post('/suggest', uploadSuggestion.single('file_upload'), async (req, res) => {
    const { resource_type, resource_title, resource_author, resource_reason, anonymous } = req.body;

    if (!resource_type || !resource_title) {
        return res.status(400).json({ message: 'Resource type and title are required.' });
    }

    try {
        const newSuggestion = new Suggestion({
            resourceType: resource_type,
            title: resource_title,
            author: resource_author,
            reason: resource_reason,
            isAnonymous: anonymous === 'on' || anonymous === true, // Handle checkbox value
            filePath: req.file ? req.file.path : null,
            // submittedBy: req.user ? req.user.id : null // If using verifyToken middleware
        });

        await newSuggestion.save();
        res.status(201).json({ message: 'Suggestion submitted successfully!', suggestion: newSuggestion });
    } catch (error) {
        console.error('Suggestion submission error:', error);
        res.status(500).json({ message: 'Server error while submitting suggestion.' });
    }
});

// POST /api/engage/apply - Handles SLC applications
router.post('/apply', uploadResume.single('applicant_resume'), async (req, res) => {
    const { applicant_name, applicant_email, applicant_roll, applicant_branch, applicant_motivation } = req.body;

    if (!applicant_name || !applicant_email || !applicant_roll || !applicant_branch || !applicant_motivation) {
        return res.status(400).json({ message: 'All fields except resume are required for application.' });
    }
    // Resume is optional as per current plan (no 'required' on form input)
    // if (!req.file) {
    //     return res.status(400).json({ message: 'Resume (PDF) is required.' });
    // }

    try {
        const newApplication = new Application({
            name: applicant_name,
            email: applicant_email,
            rollNumber: applicant_roll,
            branchYear: applicant_branch,
            motivation: applicant_motivation,
            resumePath: req.file ? req.file.path : null,
            // submittedBy: req.user ? req.user.id : null // If using verifyToken
        });

        await newApplication.save();
        res.status(201).json({ message: 'Application submitted successfully!', application: newApplication });
    } catch (error) {
        console.error('Application submission error:', error);
        if (error.message.includes('Only PDF files are allowed')) {
            return res.status(400).json({ message: 'Only PDF files are allowed for resumes.' });
        }
        res.status(500).json({ message: 'Server error while submitting application.' });
    }
});

// POST /api/engage/feedback - Handles general feedback
router.post('/feedback', async (req, res) => {
    const { feedback_name, feedback_email, feedback_subject, feedback_message } = req.body;

    if (!feedback_subject || !feedback_message) {
        return res.status(400).json({ message: 'Subject and message are required for feedback.' });
    }

    try {
        const newFeedback = new Feedback({
            name: feedback_name,
            email: feedback_email,
            subject: feedback_subject,
            message: feedback_message,
            // submittedBy: req.user ? req.user.id : null // If using verifyToken
        });

        await newFeedback.save();
        res.status(201).json({ message: 'Feedback submitted successfully!', feedback: newFeedback });
    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({ message: 'Server error while submitting feedback.' });
    }
});

module.exports = router;
