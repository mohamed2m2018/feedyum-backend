const ChefApplication = require('../../models/chefApplication');
const emailService = require('../../services/emailService');

const FIELD_LIMITS = {
  name: 120,
  businessName: 160,
  phone: 40,
  email: 254,
  area: 120,
  cuisine: 300,
  socialLink: 300,
  notes: 1000,
};

const BUSINESS_TYPES = ['home_chef', 'restaurant'];
const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * Validate a public chef application payload.
 * Returns { data } on success or { errors } keyed by field name.
 */
function validateChefApplication(body = {}) {
  const data = {};
  const errors = {};

  for (const [field, max] of Object.entries(FIELD_LIMITS)) {
    data[field] = clean(body[field]);
    if (data[field].length > max) errors[field] = `Must be at most ${max} characters`;
  }
  data.businessType = clean(body.businessType);
  data.language = body.language === 'ar' ? 'ar' : 'en';

  if (data.name.length < 2) errors.name = 'Name is required';
  if (!BUSINESS_TYPES.includes(data.businessType)) errors.businessType = 'Choose home chef or restaurant';
  if (!PHONE_PATTERN.test(data.phone)) errors.phone = 'Enter a valid phone number';
  if (data.email && !EMAIL_PATTERN.test(data.email)) errors.email = 'Enter a valid email';
  if (data.area.length < 2) errors.area = 'Area is required';

  return Object.keys(errors).length ? { errors } : { data };
}

const createChefApplication = async (req, res) => {
  // Honeypot: real users never see or fill the "website" field.
  if (clean(req.body?.website)) {
    return res.status(201).json({ success: true });
  }

  const { data, errors } = validateChefApplication(req.body);
  if (errors) {
    return res.status(400).json({ success: false, message: 'Invalid application', errors });
  }

  try {
    const application = await ChefApplication.create(data);

    try {
      await emailService.sendChefApplicationNotification(application);
      application.notificationSent = true;
      await application.save();
    } catch (emailError) {
      // The application is stored and visible in AdminJS even if the email fails.
      console.error('[ChefApplication] Notification email failed:', emailError.message);
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('[ChefApplication] Failed to save application:', error);
    return res.status(500).json({ success: false, message: 'Could not submit application' });
  }
};

module.exports = createChefApplication;
module.exports.validateChefApplication = validateChefApplication;
