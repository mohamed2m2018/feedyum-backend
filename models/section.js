const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// section schema

const sectionSchema = new Schema({
  name: { type: String, required: true },
  // Bilingual name fields for i18n
  nameArabic: { type: String },
  nameEnglish: { type: String },
  originalLanguage: { type: String, enum: ['ar', 'en'], default: 'en' },
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, // Chef who owns this section
  created_at: {
    type: Date,
    default: Date.now,
  },
});


const Section = mongoose.model('section', sectionSchema);
module.exports = Section;
