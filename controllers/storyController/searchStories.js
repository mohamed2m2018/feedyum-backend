const mongoose = require("mongoose");
const { getBlockedChefIds } = require('../../utils/getBlockedChefIds');

// Models
const Story = mongoose.model("story");
const ObjectId = mongoose.Types.ObjectId;

/**
 * Search stories with location-based sorting
 * Distance is calculated in MongoDB BEFORE pagination for correct results
 */
const searchStories = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    searchString,
    excludeReviews,
    reviewsOnly,
    authorType,
    lat,
    lng,
    ...rest
  } = req.query;

  console.log('Story search called with:', { searchString, page, limit, lat, lng, authorType });

  const errors = {};
  if (rest.category && !ObjectId.isValid(rest.category)) {
    errors.error = "Category id is invalid";
    return res.status(500).json(errors);
  }

  try {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasLocation = !isNaN(userLat) && !isNaN(userLng);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build match conditions
    const blockedChefIds = await getBlockedChefIds();
    const matchConditions = {
      ...rest,
      ...(blockedChefIds.length > 0 && { author: { $nin: blockedChefIds } }),
    };

    // Text search
    if (searchString && searchString.trim() !== '') {
      const regex = new RegExp(searchString.trim(), 'i');
      matchConditions.$or = [
        { caption: regex },
        { description: regex },
        { title: regex }
      ];
    }

    // Author type filtering
    if (authorType) {
      const User = mongoose.model("user");
      let userQuery = {};
      if (authorType === 'chef') {
        userQuery = { type: 'chef' };
      } else if (authorType === 'user') {
        userQuery = { type: { $ne: 'chef' } };
      }
      const users = await User.find(userQuery).select('_id');
      matchConditions.author = { $in: users.map(u => u._id) };
    }

    // Review filtering
    if (excludeReviews === 'true') {
      matchConditions.$and = matchConditions.$and || [];
      matchConditions.$and.push({
        $or: [
          { rating: { $exists: false } },
          { rating: null },
          { reviewMode: { $ne: true } }
        ]
      });
    } else if (reviewsOnly === 'true') {
      matchConditions.$and = matchConditions.$and || [];
      matchConditions.$and.push({
        $or: [
          { rating: { $exists: true, $ne: null } },
          { reviewMode: true }
        ]
      });
    }

    let stories;
    let totalCount;

    if (hasLocation) {
      // MongoDB Aggregation Pipeline with distance calculation
      const pipeline = [
        { $match: matchConditions },
        // Join with author to get their locations
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'authorData'
          }
        },
        { $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
        // Calculate distance using Haversine formula in MongoDB
        {
          $addFields: {
            distance: {
              $cond: {
                if: {
                  $and: [
                    { $isArray: "$authorData.locations" },
                    { $gt: [{ $size: "$authorData.locations" }, 0] }
                  ]
                },
                then: {
                  $min: {
                    $map: {
                      input: "$authorData.locations",
                      as: "loc",
                      in: {
                        $multiply: [
                          6371, // Earth radius in km
                          {
                            $acos: {
                              $min: [
                                1,
                                {
                                  $add: [
                                    {
                                      $multiply: [
                                        { $sin: { $degreesToRadians: userLat } },
                                        { $sin: { $degreesToRadians: { $ifNull: ["$$loc.lat", 0] } } }
                                      ]
                                    },
                                    {
                                      $multiply: [
                                        { $cos: { $degreesToRadians: userLat } },
                                        { $cos: { $degreesToRadians: { $ifNull: ["$$loc.lat", 0] } } },
                                        {
                                          $cos: {
                                            $subtract: [
                                              { $degreesToRadians: { $ifNull: ["$$loc.long", 0] } },
                                              { $degreesToRadians: userLng }
                                            ]
                                          }
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          }
                        ]
                      }
                    }
                  }
                },
                else: 999999
              }
            }
          }
        },
        // Round distance
        { $addFields: { distance: { $round: ["$distance", 1] } } },
        // Sort by distance BEFORE pagination
        { $sort: { distance: 1 } },
        // Facet for count + paginated data
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [
              { $skip: skip },
              { $limit: limitNum },
              {
                $project: {
                  _id: { $toString: "$_id" },
                  caption: 1,
                  description: 1,
                  title: 1,
                  poster: 1,
                  video: 1,
                  likesNo: 1,
                  views: 1,
                  reviewMode: 1,
                  rating: 1,
                  dishes: 1,
                  category: 1,
                  created_at: 1,
                  distance: 1,
                  author: {
                    _id: { $toString: "$authorData._id" },
                    fullName: "$authorData.fullName",
                    username: "$authorData.username",
                    avatar: "$authorData.avatar",
                    locations: "$authorData.locations"
                  }
                }
              }
            ]
          }
        }
      ];

      const result = await Story.aggregate(pipeline);
      stories = result[0]?.data || [];
      totalCount = result[0]?.metadata[0]?.total || 0;

    } else {
      // No location - simple query
      stories = await Story.find(matchConditions)
        .populate('author', 'fullName username avatar locations')
        .populate('dishes')
        .skip(skip)
        .limit(limitNum)
        .sort({ _id: -1 })
        .lean();

      totalCount = await Story.countDocuments(matchConditions);

      // Transform
      stories = stories.map(story => ({
        ...story,
        _id: story._id?.toString(),
        author: story.author ? {
          _id: story.author._id?.toString(),
          fullName: story.author.fullName,
          username: story.author.username,
          avatar: story.author.avatar,
          locations: story.author.locations,
        } : null,
      }));
    }

    // Clean embeddings
    stories = stories.map(story => {
      delete story.embedding;
      delete story.embeddingGenerated;
      if (story.dishes && Array.isArray(story.dishes)) {
        story.dishes = story.dishes.map(dish => {
          if (dish) {
            delete dish.embedding;
            delete dish.embeddingGenerated;
          }
          return dish;
        });
      }
      return story;
    });

    console.log(`Story search found ${stories.length} stories`);

    res.status(200).json({
      success: true,
      data: {
        stories,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalItems: totalCount,
          hasNextPage: skip + stories.length < totalCount,
          hasPrevPage: pageNum > 1,
        }
      },
    });

  } catch (err) {
    console.error('Story search error:', err);
    return res.status(500).json({ success: false, error: 'Database error during search' });
  }
};

module.exports = searchStories;