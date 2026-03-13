const mongoose = require("mongoose");

// Models
const User = mongoose.model("user");
const Follow = mongoose.model("follow");
const Menu = require("../../models/menu");
const { getBlockedChefIds } = require('../../utils/getBlockedChefIds');

var ObjectId = require("mongoose").Types.ObjectId;

/**
 * Search users with proper distance-based pagination
 * Distance is calculated in MongoDB BEFORE pagination for correct results
 */
const searchUser = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    searchString,
    currentUserId,
    filters,
    lat,
    lng,
    ...rest
  } = req.query;

  // Parse filters
  let parsedFilters = {};
  if (typeof filters === 'string') {
    try {
      parsedFilters = JSON.parse(filters);
    } catch (e) { }
  } else if (typeof filters === 'object') {
    parsedFilters = filters;
  }

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

    // Exclude blocked chefs from search results
    const blockedChefIds = await getBlockedChefIds();

    // Build match conditions
    const matchConditions = {
      type: { $ne: "guest" },
      ...(blockedChefIds.length > 0 && { _id: { $nin: blockedChefIds } }),
      ...rest,
      ...parsedFilters,
    };

    if (currentUserId) {
      matchConditions._id = { $ne: new ObjectId(currentUserId) };
    }

    if (searchString) {
      const regex = new RegExp(searchString, "i");
      matchConditions.$or = [
        { fullName: regex },
        { username: regex },
        { email: regex }
      ];
    }

    let users;
    let totalCount;

    if (hasLocation) {
      // Use aggregation to calculate distance BEFORE pagination
      const pipeline = [
        { $match: matchConditions },
        // Add distance field - calculate min distance to any location
        {
          $addFields: {
            distance: {
              $cond: {
                if: { $and: [{ $isArray: "$locations" }, { $gt: [{ $size: "$locations" }, 0] }] },
                then: {
                  $min: {
                    $map: {
                      input: "$locations",
                      as: "loc",
                      in: {
                        $multiply: [
                          6371, // Earth radius in km
                          {
                            $acos: {
                              $min: [
                                1, // Clamp to prevent NaN from acos
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
                else: 999999 // No location = very far
              }
            }
          }
        },
        // Round distance to 1 decimal
        {
          $addFields: {
            distance: { $round: ["$distance", 1] }
          }
        },
        // Sort by distance BEFORE pagination
        { $sort: { distance: 1 } },
        // Get total count before pagination
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [{ $skip: skip }, { $limit: limitNum }]
          }
        }
      ];

      const result = await User.aggregate(pipeline);
      users = result[0]?.data || [];
      totalCount = result[0]?.metadata[0]?.total || 0;

    } else {
      // No location - use simple query with default sort
      users = await User.find(matchConditions)
        .skip(skip)
        .limit(limitNum)
        .sort({ _id: -1 })
        .lean();

      totalCount = await User.countDocuments(matchConditions);
    }

    if (users.length === 0) {
      return res.json({
        data: {
          users: [],
          pagination: {
            totalPages: 0,
            currentPage: pageNum,
            hasNextPage: false,
          }
        }
      });
    }

    // Bulk lookup dish counts for chef users
    const chefUserIds = users
      .filter(u => u.type === 'chef')
      .map(u => u._id);

    let dishCountMap = {};
    if (chefUserIds.length > 0) {
      const menuCounts = await Menu.aggregate([
        { $match: { chef: { $in: chefUserIds.map(id => new ObjectId(id)) } } },
        { $project: { chef: 1, dishCount: { $size: { $ifNull: ['$dishes', []] } } } },
      ]);
      menuCounts.forEach(m => {
        dishCountMap[m.chef.toString()] = m.dishCount;
      });
    }

    // Add follow status and dish count
    const populatedUsers = await Promise.all(
      users.map(async (user) => {
        const currentUserFollowed = currentUserId ? await Follow.exists({
          follower_id: currentUserId,
          following_id: user._id,
        }) : false;

        return {
          ...user,
          currentUserFollowed: Boolean(currentUserFollowed),
          ...(user.type === 'chef' && { dishCount: dishCountMap[user._id.toString()] || 0 }),
        };
      })
    );

    return res.json({
      data: {
        users: populatedUsers,
        pagination: {
          totalPages: Math.ceil(totalCount / limitNum),
          currentPage: pageNum,
          hasNextPage: skip + users.length < totalCount,
        }
      }
    });

  } catch (err) {
    console.error('Search user error:', err);
    errors.error = "Error fetching users from database";
    return res.status(500).json({ ...errors, message: err.message });
  }
};

module.exports = searchUser;
