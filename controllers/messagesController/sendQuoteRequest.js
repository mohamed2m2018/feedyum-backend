const Message = require('../../models/message');
const Dish = require('../../models/dish');
const User = require('../../models/user');
const Order = require('../../models/order');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');

/**
 * Customer sends a structured quote request for an "upon request" dish.
 * Creates a catering order (status: pending, totalPrice: 0) + a quote_request message.
 * @route POST /api/chat/quote-request
 */
const sendQuoteRequest = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { receiverId, dishId, selectedOptions, notes } = req.body;

    // Validate required fields
    if (!receiverId || !dishId) {
      return res.status(400).json({
        message: 'Receiver ID and dish ID are required',
        messageAr: 'معرف المستلم ومعرف الطبق مطلوبان',
      });
    }

    // Verify customer exists
    const customer = await User.findById(customerId).select('fullName avatar');
    if (!customer) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify dish exists
    const dish = await Dish.findById(dishId).select('name nameArabic nameEnglish pricingType user_id');
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    // Get customer's saved delivery address from Address collection
    const Address = require('../../models/address');
    const savedAddress = await Address.findOne({ owner: customerId, isPrimary: true })
      || await Address.findOne({ owner: customerId }).sort({ createdAt: -1 });
    
    const primaryAddress = savedAddress ? {
      nameLine: savedAddress.nameLine || savedAddress.formattedAddress || '',
      location: {
        lat: savedAddress.location?.lat || '',
        long: savedAddress.location?.long || '',
      },
      isPrimary: true,
    } : null;

    // Create a catering order (pending, totalPrice: 0 until chef quotes a price)
    const cateringOrder = new Order({
      user: customerId,
      chef: receiverId,
      items: [{
        dish: dishId,
        quantity: 1,
        selectedOptions: selectedOptions?.map(opt => ({
          groupName: '',
          optionNames: [opt],
          totalAdjustment: 0,
        })) || [],
        unitPrice: 0,
      }],
      totalPrice: 0,
      subtotal: 0,
      status: 'pending',
      orderType: 'catering',
      specialInstructions: notes || '',
      lastUpdated: new Date(),
      ...(primaryAddress ? { deliveryAddress: primaryAddress } : {}),
    });

    await cateringOrder.save();

    // Build content summary
    const optionsSummary = selectedOptions?.length > 0 ? ` - ${selectedOptions.join(', ')}` : '';
    const contentText = `📋 ${dish.name}${optionsSummary}${notes ? `: ${notes}` : ''}`;

    // Create quote request message (linked to the catering order)
    const message = new Message({
      sender: customerId,
      receiver: receiverId,
      order: cateringOrder._id,
      content: contentText,
      messageType: 'quote_request',
      quoteRequest: {
        dishId,
        dishName: dish.name,
        selectedOptions: selectedOptions || [],
        notes: notes || '',
      },
      timestamp: new Date(),
    });

    await message.save();

    // Populate for response
    await message.populate('sender', 'fullName username avatar');
    await message.populate('receiver', 'fullName username avatar');

    // Emit socket event
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        io.to(receiverId.toString()).emit('newMessage', message);
        io.to(customerId.toString()).emit('newMessage', message);

        // Notify chef dashboard about new catering order
        io.to(receiverId.toString()).emit('chefDashboardUpdate', {
          type: 'newOrder',
          orderId: cateringOrder._id.toString(),
          orderType: 'catering',
        });

        console.log(`[SOCKET] Quote request + catering order ${cateringOrder._id} sent from ${customerId} to chef ${receiverId}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit quote request:', socketError.message);
    }

    // Push notification to chef
    try {
      await EnhancedNotificationService.sendChatNotification({
        recipientId: receiverId.toString(),
        senderId: customerId.toString(),
        senderName: customer.fullName,
        message: `📋 طلب عرض سعر: ${dish.name}`,
        chatId: customerId.toString(),
        senderAvatar: customer.avatar,
        messageType: 'quote_request',
      });
    } catch (notifError) {
      console.error('[NOTIF] Failed to send quote request notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: message,
      order: {
        _id: cateringOrder._id,
        status: cateringOrder.status,
        orderType: cateringOrder.orderType,
      },
    });

  } catch (error) {
    console.error('Send quote request error:', error);
    res.status(500).json({
      message: 'Failed to send quote request',
      error: error.message,
    });
  }
};

module.exports = sendQuoteRequest;
