const Cart = require('../../models/cart');
const Dish = require('../../models/dish');
const crypto = require('crypto');

// Generate a deterministic hash of selected options for composite cart key
const generateOptionsHash = (selectedOptions) => {
  if (!selectedOptions || selectedOptions.length === 0) return '';
  // Sort by groupName for deterministic ordering
  const sorted = [...selectedOptions]
    .sort((a, b) => (a.groupName || '').localeCompare(b.groupName || ''))
    .map(so => `${so.groupName}:${(so.optionNames || []).sort().join(',')}`)
    .join('|');
  return crypto.createHash('md5').update(sorted).digest('hex').slice(0, 8);
};

const addItemToCart = async (req, res) => {
  try {
    const { dishId, quantity, selectedOptions } = req.body;

    if (!dishId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Dish ID and valid quantity are required' });
    }

    // Fetch dish to get base price and validate options
    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    // Calculate unit price: base price + all option adjustments
    let totalAdjustment = 0;
    let processedOptions = [];

    if (Array.isArray(selectedOptions) && selectedOptions.length > 0) {
      processedOptions = selectedOptions.map(so => {
        const groupAdjustment = so.totalAdjustment || 0;
        totalAdjustment += groupAdjustment;
        return {
          groupName: so.groupName,
          optionNames: so.optionNames || [],
          totalAdjustment: groupAdjustment,
        };
      });
    }

    const unitPrice = dish.price + totalAdjustment;

    // Generate composite cart item key
    const optionsHash = generateOptionsHash(processedOptions);
    const cartItemKey = optionsHash ? `${dishId}_${optionsHash}` : dishId.toString();

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Match by composite key (same dish + same options = same item)
    const existingItem = cart.items.find(item => {
      const existingKey = item.cartItemKey || item.dish.toString();
      return existingKey === cartItemKey;
    });

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        dish: dishId,
        quantity,
        selectedOptions: processedOptions,
        unitPrice,
        cartItemKey,
      });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
  }
};

module.exports = addItemToCart;
