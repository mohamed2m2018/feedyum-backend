const Order = require('../../models/order');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');
const sendQuotePriceMessage = require('../../utils/sendQuotePriceMessage');

/**
 * Update the quote price on a catering order.
 * Only allowed when the order is in 'awaiting_confirmation' status
 * (chef already accepted, customer hasn't confirmed yet).
 *
 * @route PUT /api/orders/:id/quote-price
 * @body { quotePrice: number }
 */
const updateQuotePrice = async (req, res) => {
    try {
        const { id: orderId } = req.params;
        const { quotePrice, deliveryFee } = req.body;
        const chefId = req.user._id;

        // Validate at least one value provided
        const parsedPrice = quotePrice !== undefined ? Number(quotePrice) : null;
        const parsedFee = deliveryFee !== undefined ? Number(deliveryFee) : null;

        if (parsedPrice !== null && (isNaN(parsedPrice) || parsedPrice <= 0)) {
            return res.status(400).json({
                message: 'Please enter a valid price',
                messageAr: 'يرجى إدخال سعر صحيح',
            });
        }

        if (parsedFee !== null && (isNaN(parsedFee) || parsedFee < 0)) {
            return res.status(400).json({
                message: 'Please enter a valid delivery fee',
                messageAr: 'يرجى إدخال رسوم توصيل صحيحة',
            });
        }

        // Find the order
        const order = await Order.findById(orderId)
            .populate('user', 'fullName')
            .populate('chef', 'fullName')
            .populate('items.dish', 'name nameArabic nameEnglish');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify chef ownership
        if (order.chef._id.toString() !== chefId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Only catering orders
        if (order.orderType !== 'catering') {
            return res.status(400).json({
                message: 'Quote price can only be updated for catering orders',
                messageAr: 'تعديل السعر متاح فقط لطلبات عرض السعر',
            });
        }

        // Only while awaiting customer confirmation
        if (order.status !== 'awaiting_confirmation') {
            return res.status(400).json({
                message: 'Quote price can only be changed before customer confirms',
                messageAr: 'لا يمكن تعديل السعر بعد تأكيد العميل',
            });
        }

        // Update quote price if provided
        const previousPrice = order.subtotal;
        if (parsedPrice !== null) {
            order.subtotal = parsedPrice;
            if (order.items && order.items.length > 0) {
                order.items[0].unitPrice = parsedPrice;
            }
        }

        // Update delivery fee if provided
        if (parsedFee !== null) {
            order.deliveryFee = parsedFee;
        }

        // Recalculate total
        const subtotal = order.subtotal || 0;
        const fee = order.deliveryFee || 0;
        const discountAmount = order.promocode?.discountAmount || 0;
        order.totalPrice = subtotal + fee - discountAmount;
        order.lastUpdated = new Date();

        await order.save();

        console.log(`[updateQuotePrice] Order ${orderId}: price ${previousPrice} → ${parsedPrice}, total: ${order.totalPrice}`);

        // Notify customer about price change
        try {
            const socketModule = require('../../socket');
            const io = socketModule.getIO();
            if (io) {
                io.to(order.user._id.toString()).emit('orderUpdate', {
                    orderId: order._id.toString(),
                    type: 'quotePriceUpdated',
                    newPrice: parsedPrice,
                    totalPrice: order.totalPrice,
                });
            }
        } catch (socketError) {
            console.error('[SOCKET] Failed to emit quote price update:', socketError.message);
        }

        // Push notification to customer
        try {
            await EnhancedNotificationService.sendOrderNotification({
                recipientId: order.user._id.toString(),
                senderId: chefId.toString(),
                senderName: order.chef.fullName,
                title: 'تم تعديل عرض السعر',
                message: `تم تعديل السعر إلى ${parsedPrice} جنيه`,
                orderId: order._id.toString(),
            });
        } catch (notifError) {
            console.error('[NOTIF] Failed to send quote update notification:', notifError);
        }

        // Send updated price offer message in chat
        try {
            const dishName = order.items?.[0]?.dish?.name || 'Catering Order';
            const dishId = order.items?.[0]?.dish?._id || order.items?.[0]?.dish;
            await sendQuotePriceMessage({
                chefId: chefId.toString(),
                customerId: order.user._id.toString(),
                dishId,
                dishName,
                offeredPrice: order.subtotal,
                deliveryFee: order.deliveryFee || 0,
                orderId: order._id.toString(),
            });
        } catch (msgError) {
            console.error('[CHAT] Failed to send updated quote price message:', msgError);
        }

        res.json({
            success: true,
            message: 'Quote price updated successfully',
            messageAr: 'تم تعديل السعر بنجاح',
            order: {
                _id: order._id,
                subtotal: order.subtotal,
                totalPrice: order.totalPrice,
                deliveryFee: order.deliveryFee,
            },
        });

    } catch (error) {
        console.error('Update quote price error:', error);
        res.status(500).json({
            message: 'Failed to update quote price',
            error: error.message,
        });
    }
};

module.exports = updateQuotePrice;
