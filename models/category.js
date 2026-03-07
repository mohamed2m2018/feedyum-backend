const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// category schema

const CategorySchema = new Schema({
    name: String,
    nameArabic: String,
    description: String,
    image: String,
});


const Category = mongoose.model('category', CategorySchema);
module.exports = Category;
