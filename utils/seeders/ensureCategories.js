const mongoose = require('mongoose');

// Ensure the Category model is loaded
require('../../models/category');

const Category = mongoose.model('category');

// A comprehensive default set covering app expectations (names used in UI, tests, and discover)
const DEFAULT_CATEGORIES = [
  { name: 'Italian', description: 'Authentic Italian cuisine' },
  { name: 'Pasta', description: 'Various pasta dishes' },
  { name: 'Pizza', description: 'Traditional and gourmet pizzas' },
  { name: 'Seafood', description: 'Fresh seafood dishes' },
  { name: 'Vegetarian', description: 'Plant-based dishes' },
  { name: 'Dessert', description: 'Sweet treats and desserts' },
  { name: 'Desserts', description: 'Sweet treats and desserts' },
  { name: 'Beverages', description: 'Drinks and beverages' },
  { name: 'Main Course', description: 'Main course dishes' },
  { name: 'Main Courses', description: 'Main course dishes' },
  { name: 'Bakery', description: 'Breads and baked goods' },
  { name: 'Chicken', description: 'Chicken-based dishes' },
  { name: 'Burger', description: 'Burgers and sandwiches' },
  { name: 'Fast food', description: 'Quick and tasty bites' },
  { name: 'Soups and Stews', description: 'Hearty soups and stews' },
  { name: 'Sandwiches and Wraps', description: 'Sandwiches and wraps' },
  { name: 'Side Dishes', description: 'Sides and accompaniments' },
  { name: 'Homemade', description: 'Homestyle cooking' },
  { name: 'Foul and Flafel', description: 'Middle Eastern classics' },
  { name: 'Coupons', description: 'Special offers and coupons' }
];

async function ensureCategoriesSeeded() {
  // Double-check model is available
  if (!Category) {
    throw new Error('Category model not initialized');
  }

  const count = await Category.countDocuments();
  if (count > 0) {
    return { created: 0, total: count };
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


