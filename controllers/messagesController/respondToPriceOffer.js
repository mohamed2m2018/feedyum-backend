const Message = require('../../models/message');
const User = require('../../models/user');
const createCateringOrder = require('../orderController/createCateringOrder');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');

/**
 * Customer responds to a price offer (accept or decline)
 * @route PUT /api/chat/price-offer/:messageId/respond
 */
const respondToPriceOffer = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { messageId } = req.params;
    const { action, deliveryAddress } = req.body; // action: 'accept' | 'decline'

    // Validate action
    if (!action || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        message: 'Action must be "accept" or "decline"',
        messageAr: 'الإجراء يجب أن يكون "قبول" أو "رفض"',
      });
    }

    // Find the price offer message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Price offer not found' });
    }

    // Verify it's a price_offer message
    if (message.messageType !== 'price_offer') {
      return res.status(400).json({ message: 'This message is not a price offer' });
    }

    // Verify the customer is the receiver of this offer
    if (message.receiver.toString() !== customerId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to respond to this offer' });
    }

    // Verify offer is still pending
    if (message.priceOffer.status !== 'pending') {
      return res.status(400).json({
        message: `This offer has already been ${message.priceOffer.status}`,
        messageAr: `هذا العرض تم ${message.priceOffer.status === 'accepted' ? 'قبوله' : 'رفضه'} بالفعل`,
      });
    }

    // Update the price offer status
    message.priceOffer.status = action === 'accept' ? 'accepted' : 'declined';
    message.priceOffer.respondedAt = new Date();
    await message.save();

    // Populate for socket emission
    await message.populate('sender', 'fullName username avatar');
    await message.populate('receiver', 'fullName username avatar');

    let order = null;

    if (action === 'accept') {
      // Try to find the existing catering order (created when quote request was sent)
      try {
        const Order = require('../../models/order');
        const existingOrder = await Order.findOne({
          user: customerId,
          chef: message.sender._id,
          orderType: 'catering',
          status: 'pending',
          totalPrice: 0,
        }).sort({ created_at: -1 });

        if (existingOrder) {
          // Update the existing catering order with the agreed price
          const { calculateServiceFee } = require('../../config/feeConfig');
          const agreedPrice = message.priceOffer.offeredPrice;
          const serviceFee = calculateServiceFee(agreedPrice);

          existingOrder.totalPrice = Number((agreedPrice + serviceFee).toFixed(2));
          existingOrder.subtotal = agreedPrice;
          existingOrder.serviceFee = Number(serviceFee.toFixed(2));
          existingOrder.priceOfferRef = messageId;
          existingOrder.status = 'awaiting_confirmation';
          existingOrder.lastUpdated = new Date();

          // Update the item's unitPrice
          if (existingOrder.items.length > 0) {
            existingOrder.items[0].unitPrice = agreedPrice;
          }

          // Add to status history
          if (!existingOrder.statusHistory) existingOrder.statusHistory = [];
          existingOrder.statusHistory.push({
            status: 'pending',
            changedTo: 'awaiting_confirmation',
            timestamp: new Date(),
            notes: `Price offer accepted: ${agreedPrice} EGP`,
          });

          // Snapshot deposit settings from chef
          const chef = await User.findById(message.sender._id).select('chefSettings');
          if (chef?.chefSettings?.requireDeposit && chef?.chefSettings?.instapayHandle) {
            existingOrder.depositRequired = true;
            existingOrder.depositInstapayHandle = chef.chefSettings.instapayHandle;
            existingOrder.depositInstapayType = chef.chefSettings.instapayType || 'phone';
            if (chef.chefSettings.depositType === 'percentage') {
              existingOrder.depositAmount = Number(((existingOrder.totalPrice * (chef.chefSettings.depositValue || 50)) / 100).toFixed(2));
            } else {
              existingOrder.depositAmount = Number((chef.chefSettings.depositValue || 0).toFixed(2));
            }
          }

          await existingOrder.save();
          order = existingOrder;
          console.log(`[PRICE_OFFER] Updated existing catering order ${order._id} with price ${agreedPrice}`);
        } else {
          // Fallback: create a new order (backward compatibility)
          order = await createCateringOrder({
            customerId: customerId.toString(),
            chefId: message.sender._id.toString(),
            dishId: message.priceOffer.dishId,
            agreedPrice: message.priceOffer.offeredPrice,
            selectedOptions: message.priceOffer.selectedOptions || [],
            priceOfferMessageId: messageId,
            deliveryAddress: deliveryAddress || undefined,
          });
        }
      } catch (orderError) {
        // Rollback offer status on order creation failure
        message.priceOffer.status = 'pending';
        message.priceOffer.respondedAt = undefined;
        await message.save();

        console.error('[PRICE_OFFER] Failed to update/create catering order:', orderError);
        return res.status(500).json({
          message: 'Failed to create order after accepting offer',
          messageAr: 'فشل في إنشاء الطلب بعد قبول العرض',
          error: orderError.message,
        });
      }
    }

    // Emit socket event to notify chef about the response
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        const chefId = message.sender._id.toString();
        io.to(chefId).emit('priceOfferResponse', {
          messageId: message._id.toString(),
          action,
          orderId: order ? order._id.toString() : null,
        });
        // Also emit updated message to both parties
        io.to(chefId).emit('messageUpdated', message);
        io.to(customerId.toString()).emit('messageUpdated', message);
        console.log(`[SOCKET] Price offer ${action}ed by customer ${customerId}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit price offer response:', socketError.message);
    }

    // Notify chef
    try {
      const customer = await User.findById(customerId).select('fullName');
      const statusText = action === 'accept' ? '✅ تم قبول العرض' : '❌ تم رفض العرض';
      await EnhancedNotificationService.sendChatNotification({
        recipientId: message.sender._id.toString(),
        senderId: customerId.toString(),
        senderName: customer?.fullName || 'Customer',
        message: `${statusText} - ${message.priceOffer.dishName}`,
        chatId: customerId.toString(),
        messageType: 'text',
      });
    } catch (notifError) {
      console.error('[NOTIF] Failed to send price offer response notification:', notifError);
    }

    res.json({
      success: true,
      message: message,
      order: order || undefined,
      responseMessage: action === 'accept'
        ? 'Offer accepted and order created'
        : 'Offer declined',
    });

  } catch (error) {
    console.error('Respond to price offer error:', error);
    res.status(500).json({
      message: 'Failed to respond to price offer',
      error: error.message,
    });
  }
};

module.exports = respondToPriceOffer;
