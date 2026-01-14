const { r2Client, R2_BUCKET, getPublicUrl } = require("../../utils/r2Client");

/**
 * Generate a presigned URL for direct upload to R2
 * GET /api/story/get-upload-url
 * Query params: type (image or video), extension (optional)
 */
const getUploadUrl = async (req, res) => {
    try {
        const { type = 'image', extension } = req.query;
        const userId = req.user?._id || 'anonymous';
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);

        // Determine file extension and content type
        let contentType, ext, folder;
        if (type === 'video') {
            contentType = 'video/mp4';
            ext = extension || 'mp4';
            folder = 'story_videos';
        } else {
            contentType = 'image/jpeg';
            ext = extension || 'jpg';
            folder = 'story_images';
        }

        // Generate unique key for the file
        const key = `${folder}/${userId}/${timestamp}_${randomString}.${ext}`;

        // Generate presigned URL for PUT operation
        const presignedUrl = await r2Client.getSignedUrl('putObject', {
            Bucket: R2_BUCKET,
            Key: key,
            ContentType: contentType,
            Expires: 300, // URL expires in 5 minutes
        });

        // Generate the public URL that will be used after upload
        const publicUrl = getPublicUrl(key);

        console.log("Generated presigned URL:", {
            key,
            contentType,
            publicUrl,
            expiresIn: '5 minutes',
        });

        res.json({
            success: true,
            presignedUrl,
            publicUrl,
            key,
            contentType,
            expiresIn: 300,
        });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate upload URL",
            error: error.message,
        });
    }
};

module.exports = getUploadUrl;
