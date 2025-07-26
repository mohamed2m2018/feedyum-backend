const mongoose = require('mongoose');
const Dish = require('../models/dish');
const User = require('../models/user');
const Menu = require('../models/menu');

// Sample dishes data
const sampleDishes = [
  {
    id: 1,
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with fresh tomatoes, mozzarella, and basil',
    category: 'Pizza',
    price: 120,
    visible: true,
    average_rating: 4.5,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    ingredients: ['Tomato sauce', 'Mozzarella cheese', 'Fresh basil', 'Olive oil'],
    tags: ['vegetarian', 'italian', 'classic'],
    preparationTime: 15,
    nutritionalInfo: {
      calories: 280,
      protein: '12g',
      carbs: '35g',
      fat: '10g'
    },
    dietaryInfo: ['Vegetarian']
  },
  {
    id: 2,
    name: 'Chicken Shawarma',
    description: 'Tender marinated chicken with garlic sauce and vegetables',
    category: 'Middle Eastern',
    price: 85,
    visible: true,
    average_rating: 4.7,
    image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400',
    ingredients: ['Chicken breast', 'Garlic sauce', 'Pickles', 'Tomatoes', 'Onions'],
    tags: ['protein', 'middle-eastern', 'spicy'],
    preparationTime: 20,
    nutritionalInfo: {
      calories: 350,
      protein: '25g',
      carbs: '30g',
      fat: '15g'
    },
    dietaryInfo: ['High Protein']
  },
  {
    id: 3,
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with caesar dressing, croutons, and parmesan',
    category: 'Salads',
    price: 65,
    visible: true,
    average_rating: 4.2,
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    ingredients: ['Romaine lettuce', 'Caesar dressing', 'Croutons', 'Parmesan cheese'],
    tags: ['healthy', 'fresh', 'vegetarian'],
    preparationTime: 10,
    nutritionalInfo: {
      calories: 180,
      protein: '8g',
      carbs: '12g',
      fat: '12g'
    },
    dietaryInfo: ['Vegetarian', 'Low Carb']
  },
  {
    id: 4,
    name: 'Beef Burger',
    description: 'Juicy beef patty with cheese, lettuce, tomato, and special sauce',
    category: 'Burgers',
    price: 95,
    visible: true,
    average_rating: 4.6,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    ingredients: ['Beef patty', 'Cheese', 'Lettuce', 'Tomato', 'Special sauce', 'Bun'],
    tags: ['beef', 'cheese', 'classic'],
    preparationTime: 18,
    nutritionalInfo: {
      calories: 450,
      protein: '28g',
      carbs: '35g',
      fat: '22g'
    },
    dietaryInfo: ['High Protein']
  },
  {
    id: 5,
    name: 'Sushi Roll',
    description: 'Fresh salmon and avocado sushi roll with wasabi and ginger',
    category: 'Japanese',
    price: 150,
    visible: true,
    average_rating: 4.8,
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    ingredients: ['Salmon', 'Avocado', 'Sushi rice', 'Nori', 'Wasabi', 'Ginger'],
    tags: ['fresh', 'japanese', 'healthy'],
    preparationTime: 25,
    nutritionalInfo: {
      calories: 220,
      protein: '18g',
      carbs: '25g',
      fat: '8g'
    },
    dietaryInfo: ['High Protein', 'Low Fat']
  },
  {
    id: 6,
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake with chocolate frosting and berries',
    category: 'Desserts',
    price: 45,
    visible: true,
    average_rating: 4.4,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    ingredients: ['Chocolate', 'Flour', 'Sugar', 'Eggs', 'Butter', 'Berries'],
    tags: ['sweet', 'chocolate', 'dessert'],
    preparationTime: 30,
    nutritionalInfo: {
      calories: 380,
      protein: '6g',
      carbs: '55g',
      fat: '18g'
    },
    dietaryInfo: ['Vegetarian']
  }
];

async function seedDishes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/foodtok');
    
    console.log('Connected to MongoDB');
    
    // Find a sample user to assign dishes to
    const sampleUser = await User.findOne();
    if (!sampleUser) {
      console.log('No users found. Please create a user first.');
      return;
    }
    
    // Find or create a sample menu
    let sampleMenu = await Menu.findOne({ chef: sampleUser._id });
    if (!sampleMenu) {
      sampleMenu = new Menu({
        name: 'Sample Menu',
        chef: sampleUser._id,
        description: 'Sample menu for testing',
        sections: [] // Initialize empty sections array
      });
      await sampleMenu.save();
    }
    
    // Clear existing dishes
    await Dish.deleteMany({});
    console.log('Cleared existing dishes');
    
    // Add sample dishes
    for (let i = 0; i < sampleDishes.length; i++) {
      const dishData = sampleDishes[i];
      const dish = new Dish({
        ...dishData,
        id: i + 1, // Ensure unique numeric ID
        menu: sampleMenu._id,
        menu_id: 1, // Use a simple numeric ID
        user_id: sampleUser._id
      });
      await dish.save();
      console.log(`Created dish: ${dish.name}`);
    }
    
    console.log('Sample dishes created successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error seeding dishes:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDishes();