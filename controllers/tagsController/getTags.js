

const mongoose = require('mongoose');

// Models
const Tags = mongoose.model('tag');

const getTags = async (req, res) => {
    try {
        const tags = await Tags.find(); 
        res.json({ success: true, tags });
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};



module.exports = getTags;
