const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');

const keys = require('../../config/keys');
const { cleanResponseData } = require('../../utils/embeddingUtils');

// Models
const User = mongoose.model('user');

// Validations
const validateLoginUser = require('../../validations/loginUser');

// Google OAuth2 client for ID token verification
// GOOGLE_WEB_CLIENT_ID: from Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs > "Web client"
// Must match the webClientId in the mobile app's GoogleSignin.configure()
const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_WEB_CLIENT_ID);

/**
 * Verify a Google ID token and return the payload (email, name, etc.)
 * @param {string} idToken - The Google ID token from the mobile app
 * @returns {object} - The verified token payload
 * @throws {Error} - If token is invalid
 */
async function verifyGoogleIdToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_WEB_CLIENT_ID,
  });
  return ticket.getPayload();
}

const loginUser = async (req, res) => {
  // Validate
  const { errors, isValid } = validateLoginUser(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;
  const googleIdToken = req.body.googleIdToken;

  try {
    // If Google login, verify the ID token first
    if (googleIdToken) {
      const payload = await verifyGoogleIdToken(googleIdToken);

      // Ensure the token email matches the request email
      if (payload.email !== email) {
        return res.status(401).json({ error: 'Google token email mismatch' });
      }
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ incorrectinfo: 'Incorrect email or password' });
    }

    // Password check — skip only for verified Google tokens
    if (!googleIdToken) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ incorrectinfo: 'Incorrect email or password' });
      }
    }

    // User authenticated — create JWT
    const TokenPayload = {
      _id: user._id,
      email: user.email,
    };

    const { password: _, ...userData } = user._doc;

    jwt.sign(
      TokenPayload,
      keys.secretOrKey,
      (err, token) => {
        const cleanUserData = cleanResponseData(userData);
        if (user._id) {
          cleanUserData._id = user._id.toString();
        }
        return res.json({ user: cleanUserData, success: true, token: 'Bearer ' + token });
      }
    );
  } catch (error) {
    console.error('[loginUser] Google token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid Google authentication token' });
  }
};

module.exports = loginUser;