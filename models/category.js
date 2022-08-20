const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// category schema

const CategorySchema = new Schema({
    name: String,
    description: String,
});


module.exports = Category = mongoose.model('category', CategorySchema);
