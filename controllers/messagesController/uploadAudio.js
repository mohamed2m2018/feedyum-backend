const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { r2Client, R2_BUCKET, getPublicUrl } = require("../../utils/r2Client");


// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log("File filter check:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname,
    });

    // Accept audio files - be more permissive with MIME types from React Native
    const allowedMimes = [
      "audio/wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/m4a",
      "audio/aac",
      "audio/ogg",
      "audio/x-wav",
      "audio/wave",
      "application/octet-stream", // React Native sometimes sends this for audio files
    ];

    // Also check file extension as fallback
    const fileExtension = file.originalname
      ? file.originalname.toLowerCase()
      : "";
    const hasAudioExtension = [".wav", ".mp3", ".m4a", ".aac", ".ogg"].some(
      (ext) => fileExtension.endsWith(ext)
    );

    if (allowedMimes.includes(file.mimetype) || hasAudioExtension) {
      console.log("File accepted:", file.mimetype);
      cb(null, true);
    } else {
      console.log("File rejected:", file.mimetype);
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Only audio files are allowed.`
        ),
        false
      );
    }
  },
}).single("audio");

const uploadAudio = async (req, res) => {
  console.log("Audio upload request received");

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
        console.error("No audio file provided in request");
        return res.status(400).json({
          success: false,
          message: "No audio file provided",
        });
      }

      try {
        const file = req.file;
        const userId = req.user._id;

        console.log("Processing audio file:", {
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          userId: userId,
          duration: req.body.duration,
          durationParsed: parseInt(req.body.duration),
        });

        // Generate unique identifiers
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);

        // Save the uploaded file temporarily
        const tempInputPath = `/tmp/temp_audio_${timestamp}_${randomString}.wav`;
        const tempOutputPath = `/tmp/converted_audio_${timestamp}_${randomString}.mp3`;

        console.log("Saving temporary WAV file:", tempInputPath);
        fs.writeFileSync(tempInputPath, file.buffer);

        // Convert WAV to MP3 using FFmpeg
        console.log("Converting WAV to MP3...");
        await new Promise((resolve, reject) => {
          ffmpeg(tempInputPath)
            .audioCodec("libmp3lame")
            .audioBitrate(64)
            .audioFrequency(16000)
            .audioChannels(1)
            .on("start", (commandLine) => {
              console.log("FFmpeg command:", commandLine);
            })
            .on("progress", (progress) => {
              console.log("FFmpeg progress:", progress.percent + "%");
            })
            .on("end", () => {
              console.log("WAV to MP3 conversion completed");
              resolve();
            })
            .on("error", (err) => {
              console.error("FFmpeg conversion error:", err);
              reject(err);
            })
            .save(tempOutputPath);
        });

        // Read the converted MP3 file
        console.log("Reading converted MP3 file:", tempOutputPath);
        const mp3Buffer = fs.readFileSync(tempOutputPath);
        const mp3Stats = fs.statSync(tempOutputPath);

        console.log("MP3 conversion successful:", {
          originalSize: file.size,
          convertedSize: mp3Stats.size,
          compressionRatio:
            (((file.size - mp3Stats.size) / file.size) * 100).toFixed(1) + "%",
        });

        // Generate filename for MP3
        const mp3FileName = `voice_messages/${userId}/${timestamp}_${randomString}.mp3`;

        // Upload MP3 to Cloudflare R2
        const uploadParams = {
          Bucket: R2_BUCKET,
          Key: mp3FileName,
          Body: mp3Buffer,
          ContentType: "audio/mp3",
        };

        console.log("Uploading MP3 to R2:", {
          bucket: R2_BUCKET,
          key: mp3FileName,
          contentType: "audio/mp3",
          size: mp3Stats.size,
        });

        await r2Client.putObject(uploadParams).promise();
        const publicUrl = getPublicUrl(mp3FileName);

        // Clean up temporary files
        try {
          fs.unlinkSync(tempInputPath);
          fs.unlinkSync(tempOutputPath);
          console.log("Temporary files cleaned up");
        } catch (cleanupError) {
          console.warn("Failed to clean up temporary files:", cleanupError);
        }

        console.log("R2 upload successful:", {
          url: publicUrl,
          key: mp3FileName,
        });

        // Return success response
        const responseData = {
          success: true,
          url: publicUrl,
          key: mp3FileName,
          size: file.size,
          duration: parseInt(req.body.duration) || 0,
          message: "Audio uploaded successfully",
        };

        console.log("Sending response:", responseData);
        res.json(responseData);
      } catch (uploadError) {
        console.error("R2 upload error:", uploadError);
        res.status(500).json({
          success: false,
          message: "Failed to upload audio to storage",
          error: uploadError.message,
        });
      }
    });
  } catch (error) {
    console.error("Upload audio error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = uploadAudio;
