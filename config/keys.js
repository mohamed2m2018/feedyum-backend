module.exports = {
  mongoURI: 'mongodb+srv://mohamed2m2018:22233322@cookbook.oogokbq.mongodb.net/foodtok?retryWrites=true&w=majority',
  secretOrKey: 'makeitisagreatapp',
  adminEmail: 'mohamed2m2018@gmail.com',
  adminPassword: '22233322',

  // Legacy AWS S3 credentials (kept for backwards compatibility with existing content)
  aws_access_key_id: '***REMOVED***',
  aws_secret_access_key: '***REMOVED***',
  aws_s3_bucket: 'foodtokforever',
  aws_region: 'eu-central-1',

  // Cloudflare R2 Configuration (S3-compatible)
  r2_account_id: '3d5afc8657af28d0d91ec385fc42fb6b',
  r2_access_key_id: 'b0cf2bd92e9c85f3aa5874a20e6f555b',
  r2_secret_access_key: '***REMOVED***',
  r2_bucket: 'feedyum',
  r2_endpoint: 'https://3d5afc8657af28d0d91ec385fc42fb6b.r2.cloudflarestorage.com',
  r2_public_url: 'https://cdn.feedyum.com', // Custom CDN domain for R2

  stripePublishableKey: '***REMOVED***',
  stripeSecretKey: '***REMOVED***',
  oneSignalAppId: '8f642b9d-8d10-4b66-b43a-c1d0345ef13f',
  oneSignalApikey: '***REMOVED***',
  googleMapsApiKey: '***REMOVED***',
};