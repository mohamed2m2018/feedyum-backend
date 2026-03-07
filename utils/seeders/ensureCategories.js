const mongoose = require('mongoose');

// Ensure the Category model is loaded
require('../../models/category');

const Category = mongoose.model('category');

// A comprehensive default set with Arabic translations and food photos
const DEFAULT_CATEGORIES = [
  // Cuisines
  { name: 'Italian', nameArabic: 'إيطالي', description: 'Authentic Italian cuisine', image: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=200&h=200&fit=crop' },
  { name: 'Turkish', nameArabic: 'تركي', description: 'Traditional Turkish dishes', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=200&h=200&fit=crop' },
  { name: 'Japanese', nameArabic: 'ياباني', description: 'Japanese cuisine', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop' },
  { name: 'Chinese', nameArabic: 'صيني', description: 'Chinese dishes', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&h=200&fit=crop' },
  { name: 'Syrian', nameArabic: 'سوري', description: 'Syrian cuisine', image: 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=200&h=200&fit=crop' },
  { name: 'Lebanese', nameArabic: 'لبناني', description: 'Lebanese dishes', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=200&h=200&fit=crop' },
  { name: 'Indian', nameArabic: 'هندي', description: 'Indian cuisine', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop' },
  { name: 'Egyptian', nameArabic: 'مصري', description: 'Egyptian cuisine', image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=200&h=200&fit=crop' },

  // Food Types
  { name: 'Pizza', nameArabic: 'بيتزا', description: 'Traditional and gourmet pizzas', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop' },
  { name: 'Pasta', nameArabic: 'باستا', description: 'Various pasta dishes', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop' },
  { name: 'Seafood', nameArabic: 'مأكولات بحرية', description: 'Fresh seafood dishes', image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=200&h=200&fit=crop' },
  { name: 'Burger', nameArabic: 'برجر', description: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop' },
  { name: 'Chicken', nameArabic: 'فراخ', description: 'Chicken-based dishes', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=200&h=200&fit=crop' },
  { name: 'Grilled', nameArabic: 'مشويات', description: 'Grilled meats and vegetables', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop' },
  { name: 'Crepes', nameArabic: 'كريب', description: 'Sweet and savory crepes', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=200&h=200&fit=crop' },
  { name: 'Koshary', nameArabic: 'كشري', description: 'Egyptian koshary', image: 'https://images.unsplash.com/photo-1643486680385-27a647a0a3f3?w=200&h=200&fit=crop' },

  // Categories
  { name: 'Fast food', nameArabic: 'وجبات سريعة', description: 'Quick and tasty bites', image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=200&h=200&fit=crop' },
  { name: 'Main Courses', nameArabic: 'أطباق رئيسية', description: 'Main course dishes', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop' },
  { name: 'Soups and Stews', nameArabic: 'شوربة وطواجن', description: 'Hearty soups and stews', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop' },
  { name: 'Sandwiches and Wraps', nameArabic: 'ساندوتشات ولفائف', description: 'Sandwiches and wraps', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop' },
  { name: 'Foul and Flafel', nameArabic: 'فول وفلافل', description: 'Middle Eastern classics', image: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb2?w=200&h=200&fit=crop' },
  { name: 'Vegetarian', nameArabic: 'نباتي', description: 'Plant-based dishes', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop' },
  { name: 'Healthy', nameArabic: 'صحي', description: 'Healthy and nutritious options', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&h=200&fit=crop' },
  { name: 'Breakfast', nameArabic: 'فطار', description: 'Breakfast dishes', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200&h=200&fit=crop' },
  { name: 'Bakery', nameArabic: 'مخبوزات', description: 'Breads and baked goods', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop' },
  { name: 'Desserts', nameArabic: 'حلويات', description: 'Sweet treats and desserts', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop' },
  { name: 'Beverages', nameArabic: 'مشروبات', description: 'Drinks and beverages', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&h=200&fit=crop' },
  { name: 'Snacks', nameArabic: 'سناكس', description: 'Light snacks and appetizers', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200&h=200&fit=crop' },
  { name: 'Side Dishes', nameArabic: 'أطباق جانبية', description: 'Sides and accompaniments', image: 'https://images.unsplash.com/photo-1534938665831-4f6e2e262d15?w=200&h=200&fit=crop' },
  { name: 'Homemade', nameArabic: 'أكل بيتي', description: 'Homestyle cooking', image: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=200&h=200&fit=crop' },
  { name: 'Coupons', nameArabic: 'كوبونات', description: 'Special offers and coupons', image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=200&h=200&fit=crop' },

  // Legacy duplicates (some exist in DB with singular names)
  { name: 'Dessert', nameArabic: 'حلويات', description: 'Sweet treats and desserts', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop' },
  { name: 'Main Course', nameArabic: 'طبق رئيسي', description: 'Main course dishes', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop' },
  { name: 'Food', nameArabic: 'طعام', description: 'General food category', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop' },
];

async function ensureCategoriesSeeded() {
  if (!Category) {
    throw new Error('Category model not initialized');
  }

  const count = await Category.countDocuments();
  if (count > 0) {
    // Update ALL existing categories with nameArabic and image if missing
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.updateOne(
        { name: cat.name },
        { $set: { nameArabic: cat.nameArabic, image: cat.image } }
      );
    }

    // Add any new categories that don't exist yet
    const existingNames = (await Category.find({}, 'name')).map(c => c.name.trim().toLowerCase());
    const newCats = DEFAULT_CATEGORIES.filter(c => !existingNames.includes(c.name.trim().toLowerCase()));
    if (newCats.length > 0) {
      await Category.insertMany(newCats);
    }

    const total = await Category.countDocuments();
    return { created: newCats.length, total };
  }

  // Insert defaults, avoid duplicates by unique names set
  const uniqueByName = new Map();
  for (const c of DEFAULT_CATEGORIES) {
    const key = c.name.trim().toLowerCase();
    if (!uniqueByName.has(key)) uniqueByName.set(key, c);
  }

  const toInsert = Array.from(uniqueByName.values());
  if (toInsert.length === 0) {
    return { created: 0, total: 0 };
  }

  await Category.insertMany(toInsert);
  const total = await Category.countDocuments();
  return { created: toInsert.length, total };
}

module.exports = { ensureCategoriesSeeded, DEFAULT_CATEGORIES };
