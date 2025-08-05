const Cart = require('../../models/cart');
const Order = require('../../models/order');
const Message = require('../../models/message');
const User = require('../../models/user');
const PromoCode = require('../../models/promocode');
const ChefWallet = require('../../models/chefWallet');

const checkoutCart = async (req, res) => {
  try {
    const { deliveryAddress, specialInstructions, promocode } = req.body;
    
    // Import models for geographic validation
    const ChefBranch = mongoose.model("chefBranch");
    
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.dish",
      populate: {
        path: 'menu',
        populate: {
          path: 'chef',
          select: 'fullName username _id'
        }
      }
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Get the chef ID with proper error handling and fallback
    let chefId, chefName;
    
    const firstItem = cart.items[0];
    if (firstItem && firstItem.dish) {
      // Try to get chef from populated menu first
      if (firstItem.dish.menu && firstItem.dish.menu.chef) {
        chefId = firstItem.dish.menu.chef._id;
        chefName = firstItem.dish.menu.chef.fullName || firstItem.dish.menu.chef.username;
      } 
      // Fallback to user_id if menu.chef is not populated
      else if (firstItem.dish.user_id) {
        chefId = firstItem.dish.user_id;
        // We'll need to fetch the chef name separately
        const chef = await User.findById(chefId).select('fullName username');
        chefName = chef ? (chef.fullName || chef.username) : 'Chef';
      } else {
        return res.status(400).json({ 
          message: 'Unable to identify chef for cart items' 
        });
      }
    } else {
      return res.status(400).json({ 
        message: 'Invalid cart structure' 
      });
    }

    // Verify all items are from the same chef (with error handling)
    const allSameChef = cart.items.every(item => {
      if (!item.dish) return false;
      
      let itemChefId;
      if (item.dish.menu && item.dish.menu.chef) {
        itemChefId = item.dish.menu.chef._id.toString();
      } else if (item.dish.user_id) {
        itemChefId = item.dish.user_id.toString();
      } else {
        return false;
      }
      
      return itemChefId === chefId.toString();
    });

    if (!allSameChef) {
      return res.status(400).json({ 
        message: 'All items in cart must be from the same chef' 
      });
    }

    // Geographic validation: Check if chef has branches in delivery city
    if (deliveryAddress) {
      let clientCity;
      
      // Extract city from delivery address
      if (deliveryAddress.streetDetails?.area) {
        clientCity = deliveryAddress.streetDetails.area;
      } else if (deliveryAddress.nameLine) {
        const addressParts = deliveryAddress.nameLine.split(',');
        clientCity = addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : null;
      }
      
      if (clientCity) {
        // Check if chef has active branches in the delivery city
        const chefBranches = await ChefBranch.find({
          chef: chefId,
          isActive: true,
          'addressDetails.city': new RegExp(clientCity, 'i')
        });
        
        if (chefBranches.length === 0) {
          return res.status(400).json({
            message: `This chef does not deliver to ${clientCity}. Please select a different chef or delivery address.`,
            error: 'delivery_area_not_supported',
            chefId: chefId,
            deliveryCity: clientCity
          });
        }
      }
    }

    // Calculate totals (delivery fee will be set by chef when accepting)
    const subtotal = cart.items.reduce((total, item) => total + item.dish.price * item.quantity, 0);
    const serviceFee = subtotal * 0.05; // 5% service fee
    const tax = subtotal * 0.1; // 10% tax
    
    let discountAmount = 0;
    let promocodeData = null;
    
    // Apply promocode if provided
    if (promocode && promocode.code) {
      const promoCodeDoc = await PromoCode.findOne({ 
        code: promocode.code.toUpperCase(),
        isActive: true
      });

      if (promoCodeDoc) {
        // Validate promocode
        const now = new Date();
        if (now >= promoCodeDoc.validFrom && now <= promoCodeDoc.validUntil) {
          if (!promoCodeDoc.usageLimit || promoCodeDoc.usedCount < promoCodeDoc.usageLimit) {
            if (subtotal >= promoCodeDoc.minOrderAmount) {
              // Check if applicable to chef
              if (promoCodeDoc.applicableToChefs.length === 0 || 
                  promoCodeDoc.applicableToChefs.includes(chefId)) {
                
                // Calculate discount
                if (promoCodeDoc.discountType === 'percentage') {
                  discountAmount = (subtotal * promoCodeDoc.discountValue) / 100;
                  if (promoCodeDoc.maxDiscount && discountAmount > promoCodeDoc.maxDiscount) {
                    discountAmount = promoCodeDoc.maxDiscount;
                  }
                } else {
                  discountAmount = promoCodeDoc.discountValue;
                }
                
                // Ensure discount doesn't exceed subtotal
                if (discountAmount > subtotal) {
                  discountAmount = subtotal;
                }
                
                promocodeData = {
                  code: promoCodeDoc.code,
                  discountAmount: parseFloat(discountAmount.toFixed(2)),
                  discountType: promoCodeDoc.discountType
                };
                
                // Increment usage count
                promoCodeDoc.usedCount += 1;
                await promoCodeDoc.save();
              }
            }
          }
        }
      }
    }
    
    const totalPrice = subtotal + serviceFee + tax - discountAmount; // No delivery fee until chef accepts

    // Create the order (without delivery fee - chef will set it when accepting)
    const order = new Order({
      user: req.user._id,
      items: cart.items,
      totalPrice,
      subtotal,
      deliveryFee: 0, // Will be set by chef when accepting order
      serviceFee,
      tax,
      promocode: promocodeData,
      deliveryAddress,
      specialInstructions,
      chef: chefId,
      status: 'pending'
    });

    await order.save();

    // Populate the order for response
    await order.populate([
      {
        path: 'items.dish',
        select: 'name price image description'
      },
      {
        path: 'chef',
        select: 'fullName username'
      }
    ]);

    // Clear the cart
    await Cart.findOneAndDelete({ user: req.user._id });

    // Create initial chat message with order details
    const orderMessage = `🍽️ New Order Received! #${order._id.toString().slice(-6)}

📋 Order Details:
${cart.items.map(item => `• ${item.dish.name} x${item.quantity} - £${(item.dish.price * item.quantity).toFixed(2)}`).join('\n')}

💰 Subtotal: £${subtotal.toFixed(2)}
🔧 Service Fee: £${serviceFee.toFixed(2)}
🏛️ Tax: £${tax.toFixed(2)}${promocodeData ? `
🎟️ Promocode (${promocodeData.code}): -£${promocodeData.discountAmount.toFixed(2)}` : ''}
🚚 Delivery Fee: To be confirmed
💳 Total: £${totalPrice.toFixed(2)} + delivery fee
📍 Delivery: ${deliveryAddress?.nameLine || 'Address provided'}
${specialInstructions ? `📝 Notes: ${specialInstructions}` : ''}

I'll review your order and confirm the delivery fee. Thank you! 🙏`;

    // Create the initial message from chef to customer
    const initialMessage = new Message({
      sender: chefId,
      receiver: req.user._id,
      content: orderMessage,
      order: order._id, // Link message to the specific order
      timestamp: new Date()
    });

    await initialMessage.save();

    // Small delay to ensure message is properly indexed before responding
    await new Promise(resolve => setTimeout(resolve, 100));

    res.json({
      order,
      message: 'Order placed successfully and chef has been notified!',
      chefId,
      chefName,
      promocodeApplied: promocodeData ? true : false,
      discountAmount: promocodeData ? promocodeData.discountAmount : 0
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ 
      message: 'Failed to process checkout', 
      error: error.message 
    });
  }
};

module.exports = checkoutCart;