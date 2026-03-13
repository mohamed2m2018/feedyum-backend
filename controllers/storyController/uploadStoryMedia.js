const multer = require("multer");
const path = require("path");
const { uploadToR2 } = require("../../utils/r2Client");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
    fileFilter: (req, file, cb) => {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/3gpp'];
        const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}`), false);
        }
    },
});

/**
 * Upload media (image or video) for story/post creation
 * POST /api/story/upload-media
 */
const uploadStoryMedia = async (req, res) => {
    try {
        upload.single('media')(req, res, async (err) => {
            if (err) {
                console.error("Multer error:", err);
                return res.status(400).json({
                    success: false,
                    message: err.message || "File upload error",
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No file provided",
                });
            }

            const file = req.file;
            const userId = req.user?._id || 'anonymous';
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const extension = path.extname(file.originalname) || (file.mimetype.includes('video') ? '.mp4' : '.jpg');

            // Determine if it's a video or image
            const isVideo = file.mimetype.includes('video');
            const folder = isVideo ? 'story_videos' : 'story_images';
            const mediaKey = `${folder}/${userId}/${timestamp}_${randomString}${extension}`;

            try {
                console.log("Uploading story media to R2:", {
                    key: mediaKey,
                    contentType: file.mimetype,
                    size: file.size,
                    isVideo,
                });

                const result = await uploadToR2({
                    key: mediaKey,
                    body: file.buffer,
                    contentType: file.mimetype,
                });

                console.log("R2 upload successful:", {
                    url: result.url,
                    key: result.key,
                });

                // Return success response
                const responseData = {
                    success: true,
                    url: result.url,
                    key: result.key,
                    size: file.size,
                    isVideo,
                    message: isVideo ? "Video uploaded successfully" : "Image uploaded successfully",
                };

                res.json(responseData);
            } catch (uploadError) {
                console.error("R2 upload error:", uploadError);
                res.status(500).json({
                    success: false,
                    message: "Failed to upload media to storage",
                    error: uploadError.message,
                });
            }
        });
    } catch (error) {
        console.error("Upload story media error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports = uploadStoryMedia;
