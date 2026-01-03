const Order = require('../../models/order');
const Dish = require('../../models/dish');
const mongoose = require('mongoose');

const getChefDashboardStats = async (req, res) => {
  try {
    const chefId = req.user._id;

    // Define start and end of today for revenue calculation
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [stats, dishCount] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            chef: new mongoose.Types.ObjectId(chefId),
            status: { $ne: 'cancelled' } // Exclude cancelled orders
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            pendingOrders: {
              $sum: {
                $cond: [{ $in: ['$status', ['pending', 'accepted', 'preparing', 'ready_for_pickup']] }, 1, 0]
              }
            },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            },
            todayRevenue: {
              $sum: {
                $cond: [
                  { 
                    $and: [
                      { $gte: ['$created_at', startOfDay] }, 
                      { $lte: ['$created_at', endOfDay] }
                    ] 
                  }, 
                  '$totalPrice', 
                  0
                ]
              }
            },
            todayOrdersCount: {
              $sum: {
                $cond: [
                  { 
                    $and: [
                      { $gte: ['$created_at', startOfDay] }, 
                      { $lte: ['$created_at', endOfDay] }
                    ] 
                  }, 
                  1, 
                  0
                ]
              }
            }
          }
        }
      ]),
      Dish.countDocuments({ user_id: chefId })
    ]);
    
    const result = stats[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      todayRevenue: 0,
      todayOrdersCount: 0
    };

    res.json({
      success: true,
      stats: {
        ...result,
        totalDishes: dishCount
      }
    });

  } catch (error) {
    console.error('Error fetching chef dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
};

module.exports = getChefDashboardStats;
