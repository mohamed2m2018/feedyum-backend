const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const { r2Client, R2_BUCKET, getPublicUrl } = require('../utils/r2Client');
const MenuUpload = mongoose.model('menuUpload');

const auth = passport.authenticate('jwt', { session: false });

// @route  GET /api/menu-upload/get-upload-url
// @desc   Get presigned URL for uploading menu file to R2
// @access Private (chef only)
router.get('/get-upload-url', auth, async (req, res) => {
    try {
        const { type = 'image', extension } = req.query;
        const userId = req.user._id;
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);

        let contentType, ext;
        if (type === 'pdf') {
            contentType = 'application/pdf';
            ext = 'pdf';
        } else {
            contentType = 'image/jpeg';
            ext = extension || 'jpg';
        }

        const key = `menu_uploads/${userId}/${timestamp}_${randomString}.${ext}`;

        const presignedUrl = await r2Client.getSignedUrl('putObject', {
            Bucket: R2_BUCKET,
            Key: key,
            ContentType: contentType,
            Expires: 300,
        });

        const publicUrl = getPublicUrl(key);

        res.json({
            success: true,
            presignedUrl,
            publicUrl,
            key,
            contentType,
            expiresIn: 300,
        });
    } catch (error) {
        console.error('Error generating menu upload URL:', error);
        res.status(500).json({ success: false, message: 'Failed to generate upload URL' });
    }
});

// @route  POST /api/menu-upload/submit
// @desc   Submit menu upload request (after files are uploaded to R2)
// @access Private (chef only)
router.post('/submit', auth, async (req, res) => {
    try {
        const { files, notes, restaurantName, phone } = req.body;

        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ error: 'At least one file is required / يجب رفع ملف واحد على الأقل' });
        }

        if (files.length > 10) {
            return res.status(400).json({ error: 'Maximum 10 files allowed / الحد الأقصى 10 ملفات' });
        }

        // Check if chef already has a pending request
        const existingRequest = await MenuUpload.findOne({
            chef: req.user._id,
            status: { $in: ['pending', 'processing'] },
        });

        if (existingRequest) {
            return res.status(400).json({
                error: 'You already have a pending menu upload request / لديك طلب رفع منيو قيد المعالجة',
            });
        }

        const menuUpload = new MenuUpload({
            chef: req.user._id,
            files: files.map(f => ({
                url: f.url,
                key: f.key,
                type: f.type || 'image',
                originalName: f.originalName || '',
            })),
            notes: notes || '',
            restaurantName: restaurantName || req.user.fullName || '',
            phone: phone || '',
        });

        await menuUpload.save();

        res.json({
            success: true,
            message: 'Menu uploaded successfully! Our team will process it shortly. / تم رفع المنيو بنجاح! فريقنا هيقوم بإدخاله قريباً.',
            request: menuUpload,
        });
    } catch (error) {
        console.error('Error submitting menu upload:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

// @route  GET /api/menu-upload/status
// @desc   Check status of chef's menu upload request
// @access Private (chef only)
router.get('/status', auth, async (req, res) => {
    try {
        const request = await MenuUpload.findOne({
            chef: req.user._id,
        }).sort({ created_at: -1 });

        res.json({ success: true, request: request || null });
    } catch (error) {
        console.error('Error fetching menu upload status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
