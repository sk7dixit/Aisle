const express = require('express');
const router = express.Router();
const SupportRequest = require('../models/SupportRequest');
const { sendNotification, NOTIFICATION_TYPE } = require('../services/notificationService');

// @desc    Create a new support request (Escalation)
// @route   POST /api/support/request
// @access  Public (or Private)
// @desc    Create a new support request (Escalation)
// @route   POST /api/support/request
// @access  Public (or Private)
const upload = require('../middleware/upload');

router.post('/request', upload.array('images', 3), async (req, res) => {
    try {
        // When using multer, text fields are in req.body and files in req.files
        // Note: req.body fields might be strings, so we may need to parse logs if it was sent as JSON string.
        // However, given the requirement:
        // "images": [optional]

        let { userId, phone, category, summary, logs } = req.body;

        // Helper to safely parse JSON
        let metaData = {};
        if (typeof logs === 'string') {
            try {
                metaData = JSON.parse(logs);
            } catch (e) {
                console.warn('Failed to parse logs JSON', e);
            }
        } else if (typeof logs === 'object') {
            metaData = logs;
        }

        // Handle uploaded files
        const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        const newRequest = await SupportRequest.create({
            user: (userId && userId !== 'null' && userId !== 'undefined') ? userId : null,
            identifier: phone,
            category,
            summary,
            meta: metaData, // Save the metadata (address, estProducts) here
            images: imagePaths, // Save images here
            logs: [], // Initialize empty chat logs
            status: 'open'
        });

        // Notify USER (if logged in and userId is valid)
        if (userId && userId !== 'null' && userId !== 'undefined') {
            await sendNotification(userId, NOTIFICATION_TYPE.SYSTEM_ALERT, {
                message: "We've received your support request. Our team will contact you shortly.",
                actionUrl: "/profile"
            });
        }

        res.status(201).json({
            message: 'Support request created successfully',
            requestId: newRequest._id
        });

    } catch (error) {
        console.error("Support Request Error:", error);
        res.status(500).json({ message: 'Server error creating support request' });
    }
});

module.exports = router;
