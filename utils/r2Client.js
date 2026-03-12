const AWS = require("aws-sdk");
const keys = require("../config/keys");

/**
 * Cloudflare R2 Client Configuration
 * R2 is S3-compatible, so we use the AWS SDK with a custom endpoint
 */
const r2Client = new AWS.S3({
    accessKeyId: keys.r2_access_key_id,
    secretAccessKey: keys.r2_secret_access_key,
    endpoint: keys.r2_endpoint,
    region: "auto", // R2 uses 'auto' for region
    signatureVersion: "v4",
    s3ForcePathStyle: true, // Required for R2 compatibility
});

const R2_BUCKET = keys.r2_bucket;
const R2_PUBLIC_URL = keys.r2_public_url;

/**
 * Generate a public URL for an uploaded file
 * @param {string} key - The file key/path in the bucket
 * @returns {string} - Public URL for the file
 */
const getPublicUrl = (key) => {
    return `${R2_PUBLIC_URL}/${key}`;
};

/**
 * Upload a file to R2
 * @param {Object} params - Upload parameters
 * @param {string} params.key - File key/path
 * @param {Buffer} params.body - File content
 * @param {string} params.contentType - MIME type
 * @returns {Promise<{url: string, key: string}>}
 */
const uploadToR2 = async ({ key, body, contentType }) => {
    const uploadParams = {
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
    };

    await r2Client.putObject(uploadParams).promise();

    return {
        url: getPublicUrl(key),
        key: key,
    };
};

/**
 * Delete a file from R2 by its public URL or key
 * @param {string} urlOrKey - Either a full CDN URL (https://cdn.feedyum.com/path/file.ext) or just the key (path/file.ext)
 * @returns {Promise<boolean>} - True if deleted successfully
 */
const deleteFromR2 = async (urlOrKey) => {
    if (!urlOrKey) return false;

    try {
        // Extract key from full URL if needed
        const key = urlOrKey.startsWith('http')
            ? urlOrKey.replace(`${R2_PUBLIC_URL}/`, '')
            : urlOrKey;

        await r2Client.deleteObject({
            Bucket: R2_BUCKET,
            Key: key,
        }).promise();

        console.log(`[R2] Deleted: ${key}`);
        return true;
    } catch (err) {
        console.error(`[R2] Failed to delete ${urlOrKey}:`, err.message);
        return false;
    }
};

module.exports = {
    r2Client,
    R2_BUCKET,
    R2_PUBLIC_URL,
    getPublicUrl,
    uploadToR2,
    deleteFromR2,
};
