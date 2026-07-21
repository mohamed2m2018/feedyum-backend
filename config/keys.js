const keys = {
  mongoURI: process.env.NODE_ENV === 'production'
    ? process.env.MONGO_URI
    : (process.env.MONGO_URI_STAGING || process.env.MONGO_URI),
  secretOrKey: process.env.SECRET_OR_KEY,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminCookiePassword: process.env.ADMIN_COOKIE_PASSWORD,

  // Legacy AWS S3 credentials
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  aws_s3_bucket: process.env.AWS_S3_BUCKET,
  aws_region: process.env.AWS_REGION,

  // Cloudflare R2 Configuration
  r2_account_id: process.env.R2_ACCOUNT_ID,
  r2_access_key_id: process.env.R2_ACCESS_KEY_ID,
  r2_secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
  r2_bucket: process.env.R2_BUCKET,
  r2_endpoint: process.env.R2_ENDPOINT,
  r2_public_url: process.env.R2_PUBLIC_URL,

  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  oneSignalAppId: process.env.ONESIGNAL_APP_ID,
  oneSignalApikey: process.env.ONESIGNAL_API_KEY,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,

  // Paymob Payment Gateway
  paymobApiKey: process.env.PAYMOB_API_KEY,
  paymobSecretKey: process.env.PAYMOB_SECRET_KEY,
  paymobPublicKey: process.env.PAYMOB_PUBLIC_KEY,
  paymobHmacSecret: process.env.PAYMOB_HMAC_SECRET,
  paymobIntegrationId: process.env.PAYMOB_INTEGRATION_ID,
  paymobIframeId: process.env.PAYMOB_IFRAME_ID,
};

module.exports = keys;
