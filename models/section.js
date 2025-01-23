const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// section schema

const sectionSchema = new Schema({
    name: String,
    nameArabic: String,
    description: String,
});


const Section = mongoose.model('section', sectionSchema);
module.exports = Section;
