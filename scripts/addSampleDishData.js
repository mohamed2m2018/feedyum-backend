const mongoose = require('mongoose');
const Dish = require('../models/dish');
const Review = require('../models/review');
const User = require('../models/user');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/makeit', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const sampleIngredients = {
  'Caesar Salad': [
    'Romaine lettuce',
    'Parmesan cheese',
    'Caesar dressing',
    'Croutons',
    'Anchovies',
    'Garlic',
    'Lemon juice',
    'Olive oil'
  ],
  'Margherita Pizza': [
    'Pizza dough',
    'Tomato sauce',
    'Fresh mozzarella',
    'Fresh basil',
    'Olive oil',
    'Salt',
    'Black pepper'
  ],
  'Grilled Chicken': [
    'Chicken breast',
    'Olive oil',
    'Garlic',
    'Herbs (thyme, rosemary)',
    'Salt',
    'Black pepper',
    'Lemon'
  ],
  'Pasta Carbonara': [
    'Spaghetti',
    'Eggs',
    'Pancetta',
    'Parmesan cheese',
    'Black pepper',
    'Salt'
  ],
  'Veggie Burger': [
    'Plant-based patty',
    'Burger bun',
    'Lettuce',
    'Tomato',
    'Avocado',
    'Red onion',
    'Vegan mayo'
  ]
};

const sampleTags = {
  'Caesar Salad': ['Fresh', 'Healthy', 'Vegetarian'],
  'Margherita Pizza': ['Classic', 'Italian', 'Vegetarian'],
  'Grilled Chicken': ['Protein-rich', 'Healthy', 'Gluten-free'],
  'Pasta Carbonara': ['Italian', 'Creamy', 'Comfort food'],
  'Veggie Burger': ['Vegan', 'Plant-based', 'Healthy']
};

const sampleNutritionalInfo = {
  'Caesar Salad': {
    calories: 350,
    protein: '12g',
    carbs: '15g',
    fat: '28g',
    fiber: '4g',
    sodium: '800mg'
  },
  'Margherita Pizza': {
    calories: 280,
    protein: '12g',
    carbs: '36g',
    fat: '10g',
    fiber: '2g',
    sodium: '640mg'
  },
  'Grilled Chicken': {
    calories: 250,
    protein: '46g',
    carbs: '0g',
    fat: '6g',
    fiber: '0g',
    sodium: '400mg'
  },
  'Pasta Carbonara': {
    calories: 520,
    protein: '22g',
    carbs: '45g',
    fat: '28g',
    fiber: '2g',
    sodium: '900mg'
  },
  'Veggie Burger': {
    calories: 320,
    protein: '18g',
    carbs: '35g',
    fat: '12g',
    fiber: '8g',
    sodium: '580mg'
  }
};

const sampleDietaryInfo = {
  'Caesar Salad': ['Vegetarian', 'Contains dairy'],
  'Margherita Pizza': ['Vegetarian', 'Contains gluten', 'Contains dairy'],
  'Grilled Chicken': ['Gluten-free', 'Dairy-free', 'High protein'],
  'Pasta Carbonara': ['Contains gluten', 'Contains dairy', 'Contains eggs'],
  'Veggie Burger': ['Vegan', 'Plant-based', 'High fiber']
};

const sampleReviews = [
  {
    rating: 5,
    comment: 'Absolutely delicious! The flavors were perfectly balanced and the presentation was beautiful.',
  },
  {
    rating: 4,
    comment: 'Really good dish, would definitely order again. Maybe a bit too salty for my taste.',
  },
  {
    rating: 5,
    comment: 'Outstanding! This is exactly what I was craving. Fresh ingredients and great portion size.',
  },
  {
    rating: 3,
    comment: 'It was okay, nothing special but not bad either. Expected a bit more for the price.',
  },
  {
    rating: 4,
    comment: 'Good quality food, arrived hot and fresh. The chef clearly knows what they\'re doing.',
  },
  {
    rating: 5,
    comment: 'Amazing! This has become my go-to order. Consistently excellent every time.',
  }
];

async function addSampleData() {
  try {
    await connectDB();
    console.log('Adding sample dish data...');

    // Get all dishes
    const dishes = await Dish.find().limit(20);
    console.log(`Found ${dishes.length} dishes to update`);

    // Get some users for reviews
    const users = await User.find().limit(10);
    console.log(`Found ${users.length} users for reviews`);

    for (const dish of dishes) {
      const dishName = dish.name;
      
      // Add ingredients if they match our sample data
      const matchingIngredients = Object.keys(sampleIngredients).find(key => 
        dishName.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(dishName.toLowerCase())
      );

      if (matchingIngredients) {
        dish.ingredients = sampleIngredients[matchingIngredients];
        dish.tags = sampleTags[matchingIngredients] || [];
        dish.nutritionalInfo = sampleNutritionalInfo[matchingIngredients] || {};
        dish.dietaryInfo = sampleDietaryInfo[matchingIngredients] || [];
      } else {
        // Add generic ingredients for other dishes
        dish.ingredients = [
          'Fresh ingredients',
          'Seasonings',
          'Chef\'s special sauce'
        ];
        dish.tags = ['Fresh', 'Homemade'];
        dish.nutritionalInfo = {
          calories: Math.floor(Math.random() * 400) + 200,
          protein: `${Math.floor(Math.random() * 30) + 10}g`,
          carbs: `${Math.floor(Math.random() * 50) + 20}g`,
          fat: `${Math.floor(Math.random() * 20) + 5}g`,
        };
        dish.dietaryInfo = ['Made fresh daily'];
      }

      // Add preparation time
      dish.preparationTime = Math.floor(Math.random() * 30) + 15; // 15-45 minutes

      await dish.save();
      console.log(`Updated dish: ${dish.name}`);

      // Add sample reviews for this dish
      const numReviews = Math.floor(Math.random() * 4) + 1; // 1-4 reviews per dish
      
      for (let i = 0; i < numReviews && i < users.length; i++) {
        const randomReview = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
        const user = users[i];

        // Check if review already exists
        const existingReview = await Review.findOne({
          dish: dish._id,
          user: user._id
        });

        if (!existingReview) {
          const review = new Review({
            dish: dish._id,
            user: user._id,
            rating: randomReview.rating,
            comment: randomReview.comment,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          });

          await review.save();
          console.log(`Added review for dish: ${dish.name}`);
        }
      }

      // Update dish average rating
      const reviews = await Review.find({ dish: dish._id });
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        dish.average_rating = Number(avgRating.toFixed(1));
        await dish.save();
      }
    }

    console.log('Sample data added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample data:', error);
    process.exit(1);
  }
}

addSampleData();