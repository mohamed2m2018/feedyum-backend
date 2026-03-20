const Message = require('../models/message');

/**
 * Creates a price_offer message in the chat when chef sets/updates quote price.
 * Reusable by both updateOrderStatus and updateQuotePrice controllers.
 *
 * @param {Object} params
 * @param {string} params.chefId - Chef's user ID (sender)
 * @param {string} params.customerId - Customer's user ID (receiver)
 * @param {string} params.dishId - Dish ObjectId
 * @param {string} params.dishName - Dish display name
 * @param {number} params.offeredPrice - The quoted price
 * @param {number} params.deliveryFee - Delivery fee (optional)
 * @param {string} params.orderId - Associated order ID
 * @returns {Object} The created message document
 */
const sendQuotePriceMessage = async ({
    chefId,
    customerId,
    dishId,
    dishName,
    offeredPrice,
    deliveryFee = 0,
    orderId,
}) => {
    const totalWithDelivery = offeredPrice + deliveryFee;
    const deliveryText = deliveryFee > 0 ? ` + ${deliveryFee} توصيل` : '';

    const message = new Message({
        sender: chefId,
        receiver: customerId,
        content: `💰 ${dishName} - ${offeredPrice} EGP${deliveryText}`,
        messageType: 'price_offer',
        priceOffer: {
            dishId,
            dishName,
            offeredPrice: Number(offeredPrice),
            currency: 'EGP',
            selectedOptions: [],
            note: deliveryFee > 0
                ? `الإجمالي مع التوصيل: ${totalWithDelivery} جنيه`
                : '',
            status: 'pending',
        },
        timestamp: new Date(),
    });

    await message.save();

    // Populate for socket emission
    await message.populate('sender', 'fullName username avatar');
    await message.populate('receiver', 'fullName username avatar');

    // Emit via socket
    try {
        const socketModule = require('../socket');
        const io = socketModule.getIO();
        if (io) {
            io.to(customerId.toString()).emit('newMessage', message);
            io.to(chefId.toString()).emit('newMessage', message);
            console.log(`[SOCKET] Quote price message sent: chef ${chefId} → customer ${customerId}, price: ${offeredPrice}`);
        }
    } catch (socketError) {
        console.error('[SOCKET] Failed to emit quote price message:', socketError.message);
    }

    // Push notification
    try {
        const EnhancedNotificationService = require('../services/enhancedNotificationService');
        const chefUser = await require('../models/user').findById(chefId).select('fullName avatar');
        await EnhancedNotificationService.sendChatNotification({
            recipientId: customerId.toString(),
            senderId: chefId.toString(),
            senderName: chefUser?.fullName || 'Chef',
            message: `💰 عرض سعر: ${dishName} - ${offeredPrice} جنيه`,
            chatId: chefId.toString(),
            senderAvatar: chefUser?.avatar,
            messageType: 'price_offer',
        });
    } catch (notifError) {
        console.error('[NOTIF] Failed to send quote price notification:', notifError);
    }

    return message;
};

module.exports = sendQuotePriceMessage;
