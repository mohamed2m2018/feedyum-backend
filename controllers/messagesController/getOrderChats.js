const Message = require('../../models/message');
const Order = require('../../models/order');
const mongoose = require('mongoose');

/**
 * Get order-based chats for the current user with unread counts.
 * Returns orders sorted by latest message timestamp, paginated.
 */
const getOrderChats = async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    try {
        console.log('Order-chats: Fetching for user:', userId, 'Page:', pageNumber);

        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Use aggregation to get orders sorted by latest message timestamp globally
        const aggregationResult = await Order.aggregate([
            // Match orders where user is customer or chef
            {
                $match: {
                    $or: [
                        { user: userObjectId },
                        { chef: userObjectId }
                    ]
                }
            },
            // Lookup latest message for each order
            {
                $lookup: {
                    from: 'messages',
                    let: { orderId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$order', '$$orderId'] }
                            }
                        },
                        { $sort: { timestamp: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'latestMessageArr'
                }
            },
            // Add a sortTime field: use latest message timestamp if exists, otherwise order created_at
            {
                $addFields: {
                    latestMessage: { $arrayElemAt: ['$latestMessageArr', 0] },
                    sortTime: {
                        $cond: {
                            if: { $gt: [{ $size: '$latestMessageArr' }, 0] },
                            then: { $arrayElemAt: ['$latestMessageArr.timestamp', 0] },
                            else: '$created_at'
                        }
                    }
                }
            },
            // Sort by sortTime descending (newest messages first)
            { $sort: { sortTime: -1 } },
            // Facet to get total count and paginated results
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [
                        { $skip: (pageNumber - 1) * pageSize },
                        { $limit: pageSize }
                    ]
                }
            }
        ]);

        const totalOrders = aggregationResult[0]?.metadata[0]?.total || 0;
        const totalPages = Math.ceil(totalOrders / pageSize);
        const ordersWithMessages = aggregationResult[0]?.data || [];

        console.log('Order-chats: Found orders count:', ordersWithMessages.length);

        // Populate chef and user info, and format response
        const orderChats = await Promise.all(
            ordersWithMessages.map(async (orderData) => {
                // Populate chef and user
                const order = await Order.findById(orderData._id)
                    .populate('chef', 'fullName username avatar')
                    .populate('user', 'fullName username avatar')
                    .lean();

                if (!order) return null;

                // Determine the chat partner
                const isCurrentUserChef = order.chef && order.chef._id.toString() === userId.toString();
                const chatPartner = isCurrentUserChef ? order.user : order.chef;

                if (!chatPartner) {
                    console.log(`Order-chats: Missing partner for order ${order._id}`);
                    return null;
                }

                // Populate sender/receiver info in latest message if exists
                let latestMessage = orderData.latestMessage || null;
                if (latestMessage) {
                    latestMessage = await Message.findById(latestMessage._id)
                        .populate('sender', 'username avatar fullName')
                        .populate('receiver', 'username avatar fullName')
                        .lean();
                }

                // Count unread messages for this order (messages TO current user that are unread)
                const unreadCount = await Message.countDocuments({
                    order: order._id,
                    receiver: userObjectId,
                    isRead: false,
                    isDeleted: { $ne: true }
                });

                console.log(`Order-chats: Order ${order._id} has message:`, !!latestMessage, 'unread:', unreadCount);

                return {
                    orderId: order._id,
                    order: order,
                    chef: chatPartner,
                    latestMessage: latestMessage,
                    unreadCount: unreadCount
                };
            })
        );

        // Filter out nulls
        const validChats = orderChats.filter(chat => chat !== null);

        console.log('Order-chats: Returning chats count:', validChats.length);

        res.status(200).json({
            orderChats: validChats,
            totalChats: totalOrders,
            totalPages: totalPages,
            currentPage: pageNumber
        });
    } catch (error) {
        console.error('Get order chats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = getOrderChats;
