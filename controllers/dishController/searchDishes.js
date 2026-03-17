const Dish = require('../../models/dish');
const User = require('../../models/user');
const mongoose = require('mongoose');
const { getBlockedChefIds } = require('../../utils/getBlockedChefIds');
const { getDeliveryPipelineStages } = require('../../utils/deliveryAwareSorting');

/**
 * Search dishes with optional delivery-priority sorting.
 * When lat/lng is provided, deliverable dishes appear first.
 */
const searchDishes = async (req, res) => {
  try {
    const { searchString, page = 1, limit = 10, chefId, lat, lng } = req.query;
    console.log('Dish search called with:', { searchString, page, limit, lat, lng });

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasLocation = !isNaN(userLat) && !isNaN(userLng);

    const blockedChefIds = await getBlockedChefIds();

    // Build the base match filter
    const baseMatch = {
      visible: { $ne: false },
      ...(blockedChefIds.length > 0 && { user_id: { $nin: blockedChefIds } }),
    };
    if (chefId) {
      baseMatch.user_id = mongoose.Types.ObjectId.isValid(chefId)
        ? new mongoose.Types.ObjectId(chefId)
        : chefId;
    }

    // Build text search conditions if provided
    let searchMatch = {};
    if (searchString && searchString.trim() !== '') {
      searchMatch = {
        $or: [
          { name: { $regex: searchString, $options: 'i' } },
          { description: { $regex: searchString, $options: 'i' } },
          { category: { $regex: searchString, $options: 'i' } },
          { tags: { $in: [new RegExp(searchString, 'i')] } },
          { 'dietaryInfo': { $in: [new RegExp(searchString, 'i')] } },
        ],
      };
    }

    // When location is available, use aggregation for delivery-aware sorting
    if (hasLocation) {
      const pipeline = [
        { $match: { ...baseMatch, ...searchMatch } },
        // Lookup chef info
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: '_chef',
          },
        },
        { $unwind: { path: '$_chef', preserveNullAndEmptyArrays: true } },

        // Add delivery eligibility from branches
        ...getDeliveryPipelineStages(userLat, userLng),

        // Sort: deliverable first, then by rating
        { $sort: { canDeliver: -1, average_rating: -1, created_at: -1 } },

        // Facet for count + paginated data
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              { $skip: skip },
              { $limit: limitNum },
              {
                $project: {
                  _id: { $toString: '$_id' },
                  name: 1,
                  description: 1,
                  price: 1,
                  image: 1,
                  images: 1,
                  category: 1,
                  tags: 1,
                  isAvailable: 1,
                  menu: 1,
                  user_id: { $toString: '$user_id' },
                  canDeliver: 1,
                  nearestBranchDistance: 1,
                  averageRating: { $ifNull: ['$average_rating', 0] },
                  chef: {
                    _id: { $toString: '$_chef._id' },
                    fullName: '$_chef.fullName',
                    avatar: '$_chef.avatar',
                    averageRating: { $ifNull: ['$_chef.averageRating', 0] },
                  },
                },
              },
            ],
          },
        },
      ];

      const result = await Dish.aggregate(pipeline);
      const dishes = result[0]?.data || [];
      const totalCount = result[0]?.metadata[0]?.total || 0;
      const totalPages = Math.ceil(totalCount / limitNum);

      console.log(`Dish search (delivery-aware) found ${dishes.length} dishes for query: "${searchString}"`);

      return res.status(200).json({
        success: true,
        data: {
          dishes,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalItems: totalCount,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      });
    }

    // No location — fallback to simple find (no delivery sorting possible)
    const query = { ...baseMatch, ...searchMatch };
    const totalDishes = await Dish.countDocuments(query);
    const totalPages = Math.ceil(totalDishes / limitNum);

    const dishes = await Dish.find(query)
      .populate('user_id', 'fullName avatar averageRating')
      .sort({ average_rating: -1, created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Normalize format
    const formattedDishes = dishes.map(dish => ({
      ...dish,
      _id: dish._id.toString(),
      user_id: dish.user_id?._id?.toString() || dish.user_id,
      menu: dish.menu ? dish.menu.toString() : dish.menu,
      averageRating: dish.average_rating || 0,
      chef: dish.user_id
        ? {
            _id: dish.user_id._id?.toString() || dish.user_id._id,
            fullName: dish.user_id.fullName,
            avatar: dish.user_id.avatar,
            averageRating: dish.user_id.averageRating || 0,
          }
        : null,
    }));

    console.log(`Dish search found ${formattedDishes.length} dishes for query: "${searchString}"`);

    return res.status(200).json({
      success: true,
      data: {
        dishes: formattedDishes,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalDishes,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error('Dish search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search dishes',
      data: {
        dishes: [],
        pagination: {
          currentPage: parseInt(req.query.page || 1),
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    });
  }
};

module.exports = searchDishes;