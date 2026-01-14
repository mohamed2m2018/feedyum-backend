const Order = require('../../models/order');
const User = require('../../models/user');
const Dish = require('../../models/dish');
const ChefBranch = require('../../models/chefBranch');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');

const createOrder = async (req, res) => {
  try {
    const { chefId, items, deliveryAddress, notes } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!chefId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Chef ID and items are required'
      });
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
      return res.status(400).json({
        message: 'Delivery address with street and city is required'
      });
    }

    // Verify chef exists and get chef details
    const chef = await User.findById(chefId).select('fullName username type avatar');
    if (!chef || chef.type !== 'chef') {
      return res.status(404).json({
        message: 'Chef not found'
      });
    }

    // Get customer details for notifications
    const customer = await User.findById(userId).select('fullName username avatar');
    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found'
      });
    }

    // Verify all dishes exist and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.dish || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          message: 'Each item must have a valid dish ID and quantity'
        });
      }

      const dish = await Dish.findById(item.dish).select('name price');
      if (!dish) {
        return res.status(404).json({
          message: `Dish with ID ${item.dish} not found`
        });
      }

      const itemTotal = dish.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        dish: item.dish,
        quantity: item.quantity,
        price: dish.price,
        total: itemTotal
      });
    }

    // Geographic validation: Check if chef has branches in delivery city
    if (deliveryAddress) {
      let clientCity;
      let clientState;

      // Extract city from delivery address with better fallback logic
      if (deliveryAddress.city) {
        clientCity = deliveryAddress.city;
      } else if (deliveryAddress.streetDetails?.area) {
        clientCity = deliveryAddress.streetDetails.area;
      }

      if (deliveryAddress.state) {
        clientState = deliveryAddress.state;
      } else if (deliveryAddress.streetDetails?.state || deliveryAddress.streetDetails?.city) {
        // Some maps providers put state in city field when using components
        clientState = deliveryAddress.streetDetails.state || deliveryAddress.streetDetails.city;
      }

      if (!clientCity && deliveryAddress.nameLine) {
        const addressParts = deliveryAddress.nameLine.split(',');
        // Try to extract city from different positions in the address
        if (addressParts.length > 2) {
          clientCity = addressParts[addressParts.length - 2].trim();
          clientState = addressParts[addressParts.length - 1].trim();
        } else if (addressParts.length > 1) {
          clientCity = addressParts[1].trim();
        }
      }

      // Map common districts to governorates if state is missing
      if (!clientState && clientCity) {
        const cairoDistricts = [
          'nasr city', 'مدينة نصر', 'maadi', 'المعادي', 'heliopolis', 'مصر الجديدة',
          'new cairo', 'القاهرة الجديدة', 'zamalek', 'الزمالك', 'shoubra', 'shubra', 'shobra', 'shebra', 'شبرا',
          'mokattam', 'المقطم', 'rehab', 'الرحاب', 'madinaty', 'مدينتي', 'sheraton', 'شيراتون'
        ];

        const gizaDistricts = [
          'dokki', 'الدقي', 'mohandessin', 'mohandeseen', 'المهندسين', 'haram', 'al haram', 'pyramids', 'الهرم',
          'faisal', 'فيصل', 'october', '6 october', '6th of october', 'أكتوبر', 'السادس من أكتوبر',
          'sheikh zayed', 'zayed', 'الشيخ زايد'
        ];

        const lowerCity = clientCity.toLowerCase();
        if (cairoDistricts.some(d => lowerCity.includes(d))) {
          clientState = 'Cairo';
        } else if (gizaDistricts.some(d => lowerCity.includes(d))) {
          clientState = 'Giza';
        }
      }

      // Clean up city name (remove extra text)
      if (clientCity) {
        clientCity = clientCity.replace(/\b(city|governorate|gov)\b/gi, '').trim();
      }
      if (clientState) {
        clientState = clientState.replace(/\b(city|governorate|gov)\b/gi, '').trim();
      }

      if (clientCity || clientState) {
        const orConditions = [];
        if (clientCity) orConditions.push({ 'addressDetails.city': new RegExp(clientCity, 'i') });
        if (clientState) orConditions.push({ 'addressDetails.city': new RegExp(clientState, 'i') });

        // Check if chef has active branches in the delivery city
        const chefBranches = await ChefBranch.find({
          chef: chefId,
          isActive: true,
          $or: orConditions
        });

        if (chefBranches.length === 0) {
          // Fetch all active branches to tell the user where the chef delivers
          const allActiveBranches = await ChefBranch.find({
            chef: chefId,
            isActive: true
          });

          const validCities = [...new Set(allActiveBranches.map(b => b.addressDetails?.city).filter(Boolean))];
          const validCitiesString = validCities.length > 0
            ? validCities.join(', ')
            : 'other locations';

          return res.status(400).json({
            message: `This chef does not deliver to ${clientCity}. They deliver to: ${validCitiesString}`,
            error: 'delivery_area_not_supported',
            chefId: chefId,
            deliveryCity: clientCity,
            supportedCities: validCities
          });
        }
      }
    }

    // Calculate fees
    const serviceFeePctg = 0.02; // 2%
    const serviceFee = totalAmount * serviceFeePctg;
    const deliveryFee = 0; // Will be set by chef later
    const finalTotal = totalAmount + serviceFee + deliveryFee;

    // Create the order
    const order = new Order({
      user: userId,
      chef: chefId,
      items: validatedItems,
      subtotal: Number(totalAmount.toFixed(2)),
      totalPrice: Number(finalTotal.toFixed(2)),
      serviceFee: Number(serviceFee.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      deliveryAddress,
      specialInstructions: notes || '',
      status: 'pending',
      created_at: new Date()
    });

    await order.save();

    // Populate order data for response
    await order.populate('user', 'fullName username avatar');
    await order.populate('chef', 'fullName username avatar');
    await order.populate('items.dish', 'name price image description');

    // Send notifications
    try {
      // Notify chef about new order
      await EnhancedNotificationService.sendNewOrderNotification({
        chefId: chef._id.toString(),
        orderId: order._id.toString(),
        customerName: customer.fullName,
        orderTotal: finalTotal.toFixed(2),
        itemCount: validatedItems.length,
        customerAvatar: customer.avatar
      });

      // Notify customer about order status (pending)
      await EnhancedNotificationService.sendOrderStatusNotification({
        userId: customer._id.toString(),
        orderId: order._id.toString(),
        status: 'pending',
        chefName: chef.fullName,
        orderDetails: {
          total: finalTotal.toFixed(2),
          itemCount: validatedItems.length
        }
      });

      console.log('Order notifications sent successfully');
    } catch (notificationError) {
      console.error('Failed to send order notifications:', notificationError);
      // Don't fail the order creation if notifications fail
    }

    // Emit socket event to notify chef about the new order
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        io.to(chefId.toString()).emit('chefDashboardUpdate', {
          type: 'newOrder',
          orderId: order._id.toString(),
          order: order
        });
        console.log(`[SOCKET] Emitted chefDashboardUpdate (newOrder) to chef: ${chefId}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit chefDashboardUpdate:', socketError.message);
    }

    res.status(201).json({
      success: true,
      order,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      message: 'Failed to create order',
      error: error.message
    });
  }
};

module.exports = createOrder; 