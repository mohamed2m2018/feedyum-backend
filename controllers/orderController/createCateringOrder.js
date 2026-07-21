const Order = require('../../models/order');
const User = require('../../models/user');
const Dish = require('../../models/dish');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');
const { validateDeliveryDistance } = require('../../utils/deliveryValidation');
const { calculateDeliveryFee, calculateServiceFee } = require('../../config/feeConfig');

/**
 * Creates a catering order when a price offer is accepted.
 * Uses the same Order model and status pipeline as cart-based orders.
 * Called internally by respondToPriceOffer — not a standalone route.
 *
 * @param {Object} params
 * @param {string} params.customerId - Customer user ID
 * @param {string} params.chefId - Chef user ID
 * @param {string} params.dishId - Dish ID from the price offer
 * @param {number} params.agreedPrice - The price agreed upon in chat
 * @param {string[]} params.selectedOptions - Options from the price offer
 * @param {string} params.priceOfferMessageId - The message ID of the accepted price offer
 * @param {Object} params.deliveryAddress - Customer's delivery address (optional for now)
 * @returns {Object} The created order
 */
const createCateringOrder = async ({
  customerId,
  chefId,
  dishId,
  agreedPrice,
  selectedOptions = [],
  priceOfferMessageId,
  deliveryAddress,
}) => {
  // Verify chef exists
  const chef = await User.findById(chefId).select('fullName username avatar chefSettings');
  if (!chef || chef.type !== 'chef') {
    throw new Error('Chef not found');
  }

  // Verify customer exists
  const customer = await User.findById(customerId).select('fullName username avatar');
  if (!customer) {
    throw new Error('Customer not found');
  }

  // Verify dish exists
  const dish = await Dish.findById(dishId).select('name nameArabic nameEnglish price image');
  if (!dish) {
    throw new Error('Dish not found');
  }

  // Build the single order item with the agreed price
  const orderItem = {
    dish: dishId,
    quantity: 1,
    selectedOptions: selectedOptions.map(opt => ({
      groupName: opt,
      optionNames: [opt],
      totalAdjustment: 0,
    })),
    unitPrice: agreedPrice,
  };

  const subtotal = agreedPrice;

  // Calculate delivery fee if address provided
  let deliveryFee = 0;
  if (deliveryAddress && deliveryAddress.location) {
    try {
      const validationResult = await validateDeliveryDistance(chefId, deliveryAddress);
      if (validationResult.canDeliver && validationResult.nearestBranch) {
        const ChefBranch = require('../../models/chefBranch');
        const fullBranch = await ChefBranch.findById(validationResult.nearestBranch.branchId);
        if (fullBranch) {
          const destinationPlaceName =
            deliveryAddress.deliveryArea?.nameAr ||
            deliveryAddress.deliveryAreaName ||
            deliveryAddress.deliveryArea?.name ||
            deliveryAddress.deliveryArea?.nameEn ||
            '';
          deliveryFee = calculateDeliveryFee(
            validationResult.nearestDistance,
            fullBranch.deliveryTiers,
            fullBranch.deliveryFee || 0,
            fullBranch.areaDeliveryFees,
            deliveryAddress.placeId || deliveryAddress.deliveryArea?.placeId,
            destinationPlaceName
          );
        }
      }
    } catch (deliveryError) {
      console.error('[CATERING] Delivery validation error (non-blocking):', deliveryError.message);
    }
  }

  const serviceFee = calculateServiceFee(subtotal);
  const totalPrice = subtotal + deliveryFee + serviceFee;

  // Snapshot deposit settings
  let depositRequired = false;
  let depositAmount = 0;
  let depositInstapayHandle = '';
  let depositInstapayType = 'phone';
  if (chef.chefSettings?.requireDeposit && chef.chefSettings?.instapayHandle) {
    depositRequired = true;
    depositInstapayHandle = chef.chefSettings.instapayHandle;
    depositInstapayType = chef.chefSettings.instapayType || 'phone';
    if (chef.chefSettings.depositType === 'percentage') {
      depositAmount = Number(((totalPrice * (chef.chefSettings.depositValue || 50)) / 100).toFixed(2));
    } else {
      depositAmount = Number((chef.chefSettings.depositValue || 0).toFixed(2));
    }
  }

  // Create the order — same model, enters same status pipeline
  const order = new Order({
    user: customerId,
    chef: chefId,
    items: [orderItem],
    subtotal: Number(subtotal.toFixed(2)),
    totalPrice: Number(totalPrice.toFixed(2)),
    serviceFee: Number(serviceFee.toFixed(2)),
    deliveryFee: Number(deliveryFee.toFixed(2)),
    deliveryAddress: deliveryAddress || {},
    specialInstructions: '',
    paymentMethod: 'cod',
    status: 'pending', // Enters the SAME pipeline as cart orders
    orderType: 'catering',
    priceOfferRef: priceOfferMessageId,
    depositRequired,
    depositAmount,
    depositInstapayHandle,
    depositInstapayType,
    created_at: new Date(),
    lastUpdated: new Date(),
  });

  await order.save();

  // Populate for response
  await order.populate('user', 'fullName username avatar');
  await order.populate('chef', 'fullName username avatar');
  await order.populate('items.dish', 'name nameArabic nameEnglish price image description descriptionArabic descriptionEnglish');

  // Notify chef about new catering order
  try {
    await EnhancedNotificationService.sendNewOrderNotification({
      chefId: chefId.toString(),
      orderId: order._id.toString(),
      customerName: customer.fullName,
      orderTotal: totalPrice.toFixed(2),
      itemCount: 1,
      customerAvatar: customer.avatar,
    });
  } catch (notifError) {
    console.error('[CATERING] Failed to send order notification:', notifError);
  }

  // Emit socket event for chef dashboard
  try {
    const socketModule = require('../../socket');
    const io = socketModule.getIO();
    if (io) {
      io.to(chefId.toString()).emit('chefDashboardUpdate', {
        type: 'newOrder',
        orderId: order._id.toString(),
        order,
      });
      console.log(`[SOCKET] Emitted chefDashboardUpdate (catering newOrder) to chef: ${chefId}`);
    }
  } catch (socketError) {
    console.error('[SOCKET] Failed to emit catering order:', socketError.message);
  }

  return order;
};

module.exports = createCateringOrder;
