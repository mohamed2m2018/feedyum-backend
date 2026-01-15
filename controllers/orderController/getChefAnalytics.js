const Order = require('../../models/order');
const Dish = require('../../models/dish');
const mongoose = require('mongoose');

const getChefAnalytics = async (req, res) => {
  try {
    const chefId = req.user._id;
    const { period = '7days' } = req.query;

    // Calculate date ranges
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '7days':
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get all analytics data in parallel
    const [
      revenueByDay,
      ordersByStatus,
      popularDishes,
      overallStats,
      recentOrders
    ] = await Promise.all([
      // Revenue and orders by day
      Order.aggregate([
        {
          $match: {
            chef: new mongoose.Types.ObjectId(chefId),
            created_at: { $gte: startDate },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
            },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Orders by status
      Order.aggregate([
        {
          $match: {
            chef: new mongoose.Types.ObjectId(chefId),
            created_at: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Popular dishes (top 5)
      Order.aggregate([
        {
          $match: {
            chef: new mongoose.Types.ObjectId(chefId),
            status: { $ne: 'cancelled' }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.dish',
            totalOrdered: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.quantity', 1] } } // Will be enriched with dish price
          }
        },
        { $sort: { totalOrdered: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'dishes',
            localField: '_id',
            foreignField: '_id',
            as: 'dishInfo'
          }
        },
        { $unwind: { path: '$dishInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            name: '$dishInfo.name',
            image: '$dishInfo.image',
            price: '$dishInfo.price',
            totalOrdered: 1,
            revenue: { $multiply: ['$totalOrdered', { $ifNull: ['$dishInfo.price', 0] }] }
          }
        }
      ]),

      // Overall stats
      Order.aggregate([
        {
          $match: {
            chef: new mongoose.Types.ObjectId(chefId),
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: '$totalPrice' },
            periodRevenue: {
              $sum: {
                $cond: [
                  { $gte: ['$created_at', startDate] },
                  '$totalPrice',
                  0
                ]
              }
            },
            periodOrders: {
              $sum: {
                $cond: [
                  { $gte: ['$created_at', startDate] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),

      // Recent orders (last 10)
      Order.find({ chef: chefId })
        .sort({ created_at: -1 })
        .limit(10)
        .populate('user', 'fullName username avatar')
        .populate('items.dish', 'name price image')
        .lean()
    ]);

    // Get dish count
    const totalDishes = await Dish.countDocuments({ user_id: chefId });

    // Process status breakdown
    const statusBreakdown = {
      pending: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0
    };
    
    ordersByStatus.forEach(item => {
      if (item._id === 'ready_for_pickup') {
        statusBreakdown.ready = item.count;
      } else if (statusBreakdown.hasOwnProperty(item._id)) {
        statusBreakdown[item._id] = item.count;
      }
    });

    // Fill in missing days for chart data
    const chartData = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const daysCount = period === '30days' ? 30 : period === '90days' ? 90 : 7;
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * dayMs);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = revenueByDay.find(d => d._id === dateStr);
      
      chartData.push({
        date: dateStr,
        dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayData?.revenue || 0,
        orders: dayData?.orders || 0
      });
    }

    const stats = overallStats[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      periodRevenue: 0,
      periodOrders: 0
    };

    res.json({
      success: true,
      analytics: {
        period,
        summary: {
          totalRevenue: stats.totalRevenue,
          totalOrders: stats.totalOrders,
          avgOrderValue: stats.avgOrderValue || 0,
          periodRevenue: stats.periodRevenue,
          periodOrders: stats.periodOrders,
          totalDishes
        },
        chartData,
        statusBreakdown,
        popularDishes: popularDishes.map(dish => ({
          id: dish._id,
          name: dish.name || 'Unknown Dish',
          image: dish.image,
          price: dish.price || 0,
          totalOrdered: dish.totalOrdered,
          revenue: dish.revenue || 0
        })),
        recentOrders: recentOrders.map(order => ({
          id: order._id,
          customer: order.user?.fullName || order.user?.username || 'Customer',
          total: order.totalPrice,
          status: order.status,
          date: order.created_at,
          itemCount: order.items?.length || 0
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching chef analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
};

module.exports = getChefAnalytics;
