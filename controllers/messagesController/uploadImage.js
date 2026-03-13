const multer = require("multer");
const path = require("path");
const { uploadToR2 } = require("../../utils/r2Client");


// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log("Image file filter check:", {
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
      console.log("Image file accepted:", file.mimetype);
      cb(null, true);
    } else {
      console.log("Image file rejected:", file.mimetype);
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Only image files are allowed.`
        ),
        false
      );
    }
  },
}).single("image");

const uploadImage = async (req, res) => {
  console.log("Image upload request received");

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
        const userId = req.user._id;

        console.log("Processing image file:", {
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          userId: userId,
        });

        // Generate unique identifiers
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);

        // Determine file extension from mimetype
        let extension = ".jpg";
        if (file.mimetype === "image/png") extension = ".png";
        else if (file.mimetype === "image/gif") extension = ".gif";
        else if (file.mimetype === "image/webp") extension = ".webp";

        // Generate filename
        const imageFileName = `chat_images/${userId}/${timestamp}_${randomString}${extension}`;

        console.log("Uploading image to R2:", {
          key: imageFileName,
          contentType: file.mimetype,
          size: file.size,
        });

        const result = await uploadToR2({
          key: imageFileName,
          body: file.buffer,
          contentType: file.mimetype || "image/jpeg",
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
          message: "Image uploaded successfully",
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
    console.error("Upload image error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = uploadImage;
