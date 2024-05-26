const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Ensure each tag name is unique
    },
    nameAr: {
        type: String,
        required: true,
        unique: true, // Ensure each tag name is unique
    },
    weight: {
        type: Number,
        required: true,
        unique: true, // Ensure each tag name is unique
    },
    // Add other fields as needed (e.g., description, created_at)
});

const Tag = mongoose.model('tag', tagSchema);

module.exports = Tag;
