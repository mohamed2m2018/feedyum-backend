/* eslint-disable no-unsafe-optional-chaining */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const embeddingService = require('../../services/embeddingService');
const { cleanResponseData } = require('../../utils/embeddingUtils');

// Models
const User = mongoose.model('user');

// Validations
const validateUser = require('../../validations/user');

const signupUser = (req, res) => {
  // Validate
  let { errors, isValid } = validateUser(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  // Check if there is a user with the same email
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (user) {
        errors.email = 'Email already exists';
        return res.status(400).json(errors);
      }

      // Create new user
      const newUser = new User({
        email: req.body.email,
        type: req.body.type,
        password: req.body.password,
        profileCompleted: false,
        fullName: req.body.fullName,
        username: req.body.userName,
        gender: req.body.gender,
        phone: req.body.phone,
        postsNo: 0,
        likesNo: 0,
        avatar: req.body.avatar,
        isGoogleUser: req.body.isGoogleSignIn,
        bio: req.body.bio,
        locations: req.body.locations
      });

      // Check if location data is provided in the request body
      if (req.body.location) {
        const { description, lat, long } = req.body.location;
        newUser.locations.push({ description, lat, long });
      }

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(async (user) => {
              // Generate embedding for the new user
              try {
                const text = embeddingService.prepareTextForEmbedding(user, [
                  'fullName',
                  'username',
                  'bio',
                  'type'
                ]);
                
                if (text && text.trim().length > 0) {
                  const embedding = await embeddingService.generateEmbedding(text);
                  if (embedding) {
                    await User.findByIdAndUpdate(user._id, {
                      embedding: embedding,
                      embeddingGenerated: new Date()
                    });
                    console.log(`✅ Generated embedding for new user: ${user.fullName || user.username}`);
                  } else {
                    console.log(`⚠️ Failed to generate embedding for user: ${user.fullName || user.username}`);
                  }
                }
              } catch (error) {
                console.error(`❌ Error generating embedding for user ${user.fullName || user.username}:`, error.message);
                // Don't fail the user creation if embedding generation fails
              }

              // JWT Payload
              const TokenPayload = {
                _id: user._id,
                email: user.email,
              };
              const { password, ...userData } = user?._doc;

              // Make JWT
              jwt.sign(
                TokenPayload,
                keys.secretOrKey,
                // { expiresIn: 604800 },
                (err, token) => {
                  // Remove embeddings from response
                  const cleanUserData = cleanResponseData(userData);
                  return res.json({ user: cleanUserData, success: true, token: 'Bearer ' + token });
                }
              );
            })
            .catch((err) => {
              errors.error = 'Error saving user to the database';
              res.status(500).json({ ...errors, ...err });
            });
        });
      });
    })
    .catch((err) => {
      errors.error = 'Error checking for the user in the database';
      res.status(500).json({ ...errors, ...err });
    });
};

module.exports = signupUser;
