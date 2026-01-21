const mongoose = require('mongoose');
const Dish = require('../../models/dish');
const User = require('../../models/user');
const { cleanResponseData } = require('../../utils/embeddingUtils');

const ObjectId = mongoose.Types.ObjectId;

/**
 * Get all dishes with proper distance-based pagination
 * Distance is calculated in MongoDB BEFORE pagination for correct results
 */
const getAllDishes = async (req, res) => {
  try {
    const { page = 1, limit = 15, lat, lng, sortBy } = req.query;

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasLocation = !isNaN(userLat) && !isNaN(userLng);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let dishes;
    let totalCount;

    if (hasLocation) {
      // Use aggregation to calculate distance BEFORE pagination
      const pipeline = [
        // Lookup chef/user info
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'chef'
          }
        },
        { $unwind: { path: '$chef', preserveNullAndEmptyArrays: true } },
        // Calculate distance to chef's nearest location
        {
          $addFields: {
            distance: {
              $cond: {
                if: { $and: [{ $isArray: "$chef.locations" }, { $gt: [{ $size: "$chef.locations" }, 0] }] },
                then: {
                  $min: {
                    $map: {
                      input: "$chef.locations",
                      as: "loc",
                      in: {
                        $multiply: [
                          6371,
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
        { $addFields: { distance: { $round: ["$distance", 1] } } },
        // Sort by distance BEFORE pagination
        { $sort: { distance: 1 } },
        // Facet for total count and paginated data
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [
              { $skip: skip },
              { $limit: limitNum },
              // Project chef info - convert IDs to strings for consistent grouping
              {
                $project: {
                  _id: { $toString: "$_id" },
                  name: 1,
                  description: 1,
                  price: 1,
                  image: 1,
                  images: 1,
                  category: 1,
                  tags: 1,
                  isAvailable: 1,
                  user_id: { $toString: "$user_id" },
                  menu: 1,
                  distance: 1,
                  averageRating: { $ifNull: ["$average_rating", 0] },
                  chef: {
                    _id: { $toString: "$chef._id" },
                    fullName: "$chef.fullName",
                    username: "$chef.username",
                    avatar: "$chef.avatar",
                    locations: "$chef.locations",
                    averageRating: { $ifNull: ["$chef.averageRating", 0] }
                  }
                }
              }
            ]
          }
        }
      ];

      const result = await Dish.aggregate(pipeline);
      dishes = result[0]?.data || [];
      totalCount = result[0]?.metadata[0]?.total || 0;

    } else {
      // No location - simple query
      dishes = await Dish.find()
        .populate('menu')
        .populate('user_id', 'fullName username avatar locations averageRating')
        .skip(skip)
        .limit(limitNum)
        .sort({ _id: -1 })
        .lean();

      totalCount = await Dish.countDocuments();

      // Transform - ensure IDs are strings and normalize field names
      dishes = dishes.map(dish => ({
        ...dish,
        _id: dish._id?.toString(),
        user_id: dish.user_id?._id?.toString() || dish.user_id?.toString(),
        averageRating: dish.average_rating || 0,
        chef: dish.user_id?._id ? {
          _id: dish.user_id._id.toString(),
          fullName: dish.user_id.fullName,
          username: dish.user_id.username,
          avatar: dish.user_id.avatar,
          locations: dish.user_id.locations,
          averageRating: dish.user_id.averageRating || 0,
        } : null,
      }));
    }

    // Clean embeddings
    const cleanDishes = cleanResponseData(dishes);

    res.status(200).json({
      success: true,
      data: {
        dishes: cleanDishes,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          hasMore: skip + dishes.length < totalCount,
          hasNextPage: skip + dishes.length < totalCount,
        }
      }
    });
  } catch (error) {
    console.error('getAllDishes error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = getAllDishes;
