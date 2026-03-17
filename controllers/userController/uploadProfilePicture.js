const multer = require("multer");
const { r2Client, R2_BUCKET, getPublicUrl, prefixKey } = require("../../utils/r2Client");

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log("Profile image file filter check:", {
            originalname: file.originalname,
            mimetype: file.mimetype,
            fieldname: file.fieldname,
        });

        // Accept image files
        const allowedMimes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/octet-stream", // React Native sometimes sends this
        ];

        // Also check file extension as fallback
        const fileExtension = file.originalname
            ? file.originalname.toLowerCase()
            : "";
        const hasImageExtension = [".jpg", ".jpeg", ".png", ".gif", ".webp"].some(
            (ext) => fileExtension.endsWith(ext)
        );

        if (allowedMimes.includes(file.mimetype) || hasImageExtension) {
            console.log("Profile image file accepted:", file.mimetype);
            cb(null, true);
        } else {
            console.log("Profile image file rejected:", file.mimetype);
            cb(
                new Error(
                    `Invalid file type: ${file.mimetype}. Only image files are allowed.`
                ),
                false
            );
        }
    },
}).single("image");

/**
 * Upload profile picture during registration (public endpoint)
 * This endpoint doesn't require authentication because it's used during signup
 * @route POST /api/user/upload-profile-picture
 * @access Public
 */
const uploadProfilePicture = async (req, res) => {
    console.log("Profile picture upload request received (public)");

    try {
        // Handle file upload with multer
        upload(req, res, async (err) => {
            if (err) {
                console.error("Multer upload error:", err);
                return res.status(400).json({
                    success: false,
                    message: err.message || "File upload failed",
                });
            }

            if (!req.file) {
                console.error("No image file provided in request");
                return res.status(400).json({
                    success: false,
                    message: "No image file provided",
                });
            }

            try {
                const file = req.file;

                console.log("Processing profile image file:", {
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                });

                // Generate unique identifiers
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 15);

                // Determine file extension from mimetype
                let extension = ".jpg";
                if (file.mimetype === "image/png") extension = ".png";
                else if (file.mimetype === "image/gif") extension = ".gif";
                else if (file.mimetype === "image/webp") extension = ".webp";

                // Generate filename - use a dedicated folder for profile pictures
                const imageFileName = `profile_pictures/registration/${timestamp}_${randomString}${extension}`;

                // Upload to Cloudflare R2
                const uploadParams = {
                    Bucket: R2_BUCKET,
                    Key: prefixKey(imageFileName),
                    Body: file.buffer,
                    ContentType: file.mimetype || "image/jpeg",
                };

                console.log("Uploading profile picture to R2:", {
                    bucket: R2_BUCKET,
                    key: imageFileName,
                    contentType: file.mimetype,
                    size: file.size,
                });

                await r2Client.putObject(uploadParams).promise();
                const publicUrl = getPublicUrl(imageFileName);

                console.log("R2 profile picture upload successful:", {
                    url: publicUrl,
                    key: imageFileName,
                });

                // Return success response
                const responseData = {
                    success: true,
                    url: publicUrl,
                    key: imageFileName,
                    size: file.size,
                    message: "Profile picture uploaded successfully",
                };

                console.log("Sending response:", responseData);
                res.json(responseData);
            } catch (uploadError) {
                console.error("R2 upload error:", uploadError);
                res.status(500).json({
                    success: false,
                    message: "Failed to upload image to storage",
                    error: uploadError.message,
                });
            }
        });
    } catch (error) {
        console.error("Upload profile picture error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports = uploadProfilePicture;
