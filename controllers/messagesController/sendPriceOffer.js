const Message = require('../../models/message');
const Dish = require('../../models/dish');
const User = require('../../models/user');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');

/**
 * Chef sends a price offer for an "upon request" dish
 * @route POST /api/chat/price-offer
 */
const sendPriceOffer = async (req, res) => {
  try {
    const chefId = req.user._id;
    const { receiverId, dishId, offeredPrice, note, selectedOptions } = req.body;

    // Validate required fields
    if (!receiverId || !dishId || !offeredPrice) {
      return res.status(400).json({
        message: 'Receiver ID, dish ID, and offered price are required',
        messageAr: 'معرف المستلم ومعرف الطبق والسعر المعروض مطلوبون',
      });
    }

    if (offeredPrice <= 0) {
      return res.status(400).json({
        message: 'Offered price must be greater than 0',
        messageAr: 'السعر المعروض يجب أن يكون أكبر من صفر',
      });
    }

    // Verify chef exists and is actually a chef
    const chef = await User.findById(chefId).select('fullName type avatar');
    if (!chef || chef.type !== 'chef') {
      return res.status(403).json({ message: 'Only chefs can send price offers' });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId).select('fullName avatar');
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Verify dish exists and belongs to this chef
    const dish = await Dish.findById(dishId).select('name nameArabic nameEnglish pricingType user_id');
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    if (dish.user_id.toString() !== chefId.toString()) {
      return res.status(403).json({ message: 'You can only send price offers for your own dishes' });
    }

    // Create price offer message
    const message = new Message({
      sender: chefId,
      receiver: receiverId,
      content: `💰 ${dish.name} - ${offeredPrice} EGP`,
      messageType: 'price_offer',
      priceOffer: {
        dishId: dishId,
        dishName: dish.name,
        offeredPrice: Number(offeredPrice),
        currency: 'EGP',
        selectedOptions: selectedOptions || [],
        note: note || '',
        status: 'pending',
      },
      timestamp: new Date(),
    });

    await message.save();

    // Populate for response
    await message.populate('sender', 'fullName username avatar');
    await message.populate('receiver', 'fullName username avatar');
    await message.populate('priceOffer.dishId', 'name image');

    // Emit socket event
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        io.to(receiverId.toString()).emit('newMessage', message);
        io.to(chefId.toString()).emit('newMessage', message);
        console.log(`[SOCKET] Price offer sent from chef ${chefId} to ${receiverId}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit price offer:', socketError.message);
    }

    // Push notification
    try {
      await EnhancedNotificationService.sendChatNotification({
        recipientId: receiverId.toString(),
        senderId: chefId.toString(),
        senderName: chef.fullName,
        message: `💰 عرض سعر: ${dish.name} - ${offeredPrice} EGP`,
        chatId: chefId.toString(),
        senderAvatar: chef.avatar,
        messageType: 'price_offer',
      });
    } catch (notifError) {
      console.error('[NOTIF] Failed to send price offer notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: message,
    });

  } catch (error) {
    console.error('Send price offer error:', error);
    res.status(500).json({
      message: 'Failed to send price offer',
      error: error.message,
    });
  }
};

module.exports = sendPriceOffer;
