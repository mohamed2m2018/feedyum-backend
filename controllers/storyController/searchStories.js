const mongoose = require("mongoose");
const { search } = require("../../routes/user");

// Models
const Story = mongoose.model("story");
var ObjectId = require("mongoose").Types.ObjectId;

 const searchStories = (req, res) => {
  const { page = 1, limit = 10, searchString, ...rest } = req.query;
  const string = new RegExp(searchString, 'i')
  const errors = {};
  if (rest.category && !ObjectId.isValid(rest.category)) {
    errors.error = "Category id is invalid";
    return res.status(500).json(errors);
  }
  Story.find(
    searchString
      ? {
          $or: [{caption: string },{description: string}, {title: string}],
          ...rest,
        }
      : {
          ...rest,
        }
  )
    .limit(limit * 1)
    .populate('author', 'fullName')
    .populate("dishes")
    .skip((page - 1) * limit)
    .sort({ _id: -1 })
    .exec()
    .then(async (stories) => {
      if (stories.length === 0) {
        
        return res.json({stories: []});
      }
      // get total documents in the stories collection
      const count = await Story.countDocuments();

      // return response with stories, total pages, and current page
      res.json({
        stories,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    })
    .catch((err) => {
      errors.error = "Error fetching stories from database";
      res.status(500).json({ ...errors, ...err });
    });
};
module.exports = searchStories;