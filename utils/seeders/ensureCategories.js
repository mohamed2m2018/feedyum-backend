const mongoose = require('mongoose');

// Ensure the Category model is loaded
require('../../models/category');

const Category = mongoose.model('category');

// A comprehensive default set with Arabic translations and food photos
const DEFAULT_CATEGORIES = [
  // Cuisines
  { name: 'Italian', nameArabic: 'إيطالي', description: 'Authentic Italian cuisine', descriptionArabic: 'المطبخ الإيطالي الأصيل', image: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=200&h=200&fit=crop' },
  { name: 'Turkish', nameArabic: 'تركي', description: 'Traditional Turkish dishes', descriptionArabic: 'أطباق تركية تقليدية', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=200&h=200&fit=crop' },
  { name: 'Japanese', nameArabic: 'ياباني', description: 'Japanese cuisine', descriptionArabic: 'المطبخ الياباني', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop' },
  { name: 'Chinese', nameArabic: 'صيني', description: 'Chinese dishes', descriptionArabic: 'أطباق صينية', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&h=200&fit=crop' },
  { name: 'Syrian', nameArabic: 'سوري', description: 'Syrian cuisine', descriptionArabic: 'المطبخ السوري', image: 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=200&h=200&fit=crop' },
  { name: 'Lebanese', nameArabic: 'لبناني', description: 'Lebanese dishes', descriptionArabic: 'أطباق لبنانية', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=200&h=200&fit=crop' },
  { name: 'Indian', nameArabic: 'هندي', description: 'Indian cuisine', descriptionArabic: 'المطبخ الهندي', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop' },
  { name: 'Egyptian', nameArabic: 'مصري', description: 'Egyptian cuisine', descriptionArabic: 'المطبخ المصري', image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=200&h=200&fit=crop' },

  // Food Types
  { name: 'Pizza', nameArabic: 'بيتزا', description: 'Traditional and gourmet pizzas', descriptionArabic: 'بيتزا تقليدية وفاخرة', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop' },
  { name: 'Pasta', nameArabic: 'باستا', description: 'Various pasta dishes', descriptionArabic: 'أطباق باستا متنوعة', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop' },
  { name: 'Seafood', nameArabic: 'مأكولات بحرية', description: 'Fresh seafood dishes', descriptionArabic: 'أطباق بحرية طازجة', image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=200&h=200&fit=crop' },
  { name: 'Burger', nameArabic: 'برجر', description: 'Burgers', descriptionArabic: 'برجر', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop' },
  { name: 'Chicken', nameArabic: 'فراخ', description: 'Chicken-based dishes', descriptionArabic: 'أطباق الفراخ', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=200&h=200&fit=crop' },
  { name: 'Grilled', nameArabic: 'مشويات', description: 'Grilled meats and vegetables', descriptionArabic: 'لحوم وخضروات مشوية', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop' },
  { name: 'Crepes', nameArabic: 'كريب', description: 'Sweet and savory crepes', descriptionArabic: 'كريب حلو ومالح', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=200&h=200&fit=crop' },
  { name: 'Koshary', nameArabic: 'كشري', description: 'Egyptian koshary', descriptionArabic: 'كشري مصري', image: 'https://images.unsplash.com/photo-1643486680385-27a647a0a3f3?w=200&h=200&fit=crop' },

  // Categories
  { name: 'Fast food', nameArabic: 'وجبات سريعة', description: 'Quick and tasty bites', descriptionArabic: 'وجبات سريعة ولذيذة', image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=200&h=200&fit=crop' },
  { name: 'Main Courses', nameArabic: 'أطباق رئيسية', description: 'Main course dishes', descriptionArabic: 'الأطباق الرئيسية', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop' },
  { name: 'Soups and Stews', nameArabic: 'شوربة وطواجن', description: 'Hearty soups and stews', descriptionArabic: 'شوربات وطواجن شهية', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop' },
  { name: 'Sandwiches and Wraps', nameArabic: 'ساندوتشات ولفائف', description: 'Sandwiches and wraps', descriptionArabic: 'ساندوتشات ولفائف', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop' },
  { name: 'Foul and Flafel', nameArabic: 'فول وفلافل', description: 'Middle Eastern classics', descriptionArabic: 'أكلات شرقية كلاسيكية', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop' },
  { name: 'Vegetarian', nameArabic: 'نباتي', description: 'Plant-based dishes', descriptionArabic: 'أطباق نباتية', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop' },
  { name: 'Healthy', nameArabic: 'صحي', description: 'Healthy and nutritious options', descriptionArabic: 'خيارات صحية ومغذية', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&h=200&fit=crop' },
  { name: 'Breakfast', nameArabic: 'فطار', description: 'Breakfast dishes', descriptionArabic: 'أطباق فطار', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200&h=200&fit=crop' },
  { name: 'Bakery', nameArabic: 'مخبوزات', description: 'Breads and baked goods', descriptionArabic: 'خبز ومخبوزات', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop' },
  { name: 'Desserts', nameArabic: 'حلويات', description: 'Sweet treats and desserts', descriptionArabic: 'حلويات ومقرمشات', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop' },
  { name: 'Beverages', nameArabic: 'مشروبات', description: 'Drinks and beverages', descriptionArabic: 'مشروبات متنوعة', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&h=200&fit=crop' },
  { name: 'Snacks', nameArabic: 'سناكس', description: 'Light snacks and appetizers', descriptionArabic: 'سناكس ومقبلات خفيفة', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200&h=200&fit=crop' },
  { name: 'Side Dishes', nameArabic: 'أطباق جانبية', description: 'Sides and accompaniments', descriptionArabic: 'أطباق جانبية ومرافقة', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop' },
  { name: 'Homemade', nameArabic: 'أكل بيتي', description: 'Homestyle cooking', descriptionArabic: 'طبخ بيتي', image: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=200&h=200&fit=crop' },
];

async function ensureCategoriesSeeded() {
  if (!Category) {
    throw new Error('Category model not initialized');
  }

  const count = await Category.countDocuments();
  if (count > 0) {
    // Update ALL existing categories with nameArabic, descriptionArabic and image if missing
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.updateOne(
        { name: cat.name },
        { $set: { nameArabic: cat.nameArabic, descriptionArabic: cat.descriptionArabic, image: cat.image } }
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
