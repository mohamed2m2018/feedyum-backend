const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// story schema

const StorySchema = new Schema({
    title: String,
    description: String,
    image: String,
    price: Number,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    stories: [
      {
        media: String,
        mediaType: 'image'| 'video'
      }]
});


module.exports = Story = mongoose.model('story', StorySchema);
