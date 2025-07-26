const Order = require('../../models/order');
const ChefWallet = require('../../models/chefWallet');

const updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryFee, serviceFee } = req.body;
    
    // Prepare update object
    const updateData = { status };
    
    // Add delivery fee if provided (when chef accepts order)
    if (deliveryFee !== undefined && deliveryFee !== null) {
      updateData.deliveryFee = parseFloat(deliveryFee);
    }
    
    // Add service fee if provided
    if (serviceFee !== undefined && serviceFee !== null) {
      updateData.serviceFee = parseFloat(serviceFee);
    }
    
    // If delivery fee is being set, recalculate total price
    if (deliveryFee !== undefined) {
      const order = await Order.findById(req.params.id);
      if (order) {
        const newDeliveryFee = parseFloat(deliveryFee);
        const newServiceFee = parseFloat(serviceFee) || 0;
        const subtotal = order.subtotal || 0;
        const tax = order.tax || 0;
        
        updateData.totalPrice = subtotal + newDeliveryFee + newServiceFee + tax;
      }
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).populate([
      {
        path: 'user',
        select: 'fullName username avatar type'
      },
      {
        path: 'chef',
        select: 'fullName username avatar type'
      },
      {
        path: 'items.dish',
        select: 'name price image description'
      }
    ]);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Handle chef wallet service fee deduction when order is completed
    if (status === 'completed' || status === 'delivered') {
      try {
        // Find or create chef wallet
        let chefWallet = await ChefWallet.findOne({ chef: order.chef._id });
        if (!chefWallet) {
          chefWallet = new ChefWallet({ chef: order.chef._id });
          await chefWallet.save();
        }

        // Add service fee transaction (5% of subtotal)
        await chefWallet.addServiceFee(order._id, order.subtotal);
        
        console.log(`Service fee deducted for chef ${order.chef._id}, order ${order._id}`);
      } catch (walletError) {
        console.error('Chef wallet service fee error:', walletError);
        // Don't fail the order update if wallet update fails
      }
    }

    res.status(200).json({
      success: true,
      order: order,
      message: `Order ${status} successfully`
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update order status',
      error: error.message 
    });
  }
};

module.exports = updateOrderStatus;
