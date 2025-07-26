const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// section schema

const sectionSchema = new Schema({
    name: { type: String, required: true },
    nameArabic: String,
    description: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, // Chef who owns this section
    created_at: {
      type: Date,
      default: Date.now,
    },
});


const Section = mongoose.model('section', sectionSchema);
module.exports = Section;
