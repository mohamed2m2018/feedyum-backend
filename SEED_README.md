# Seeding Sample Dishes

To add sample dishes for testing the search functionality:

1. Make sure MongoDB is running
2. Make sure you have at least one user in the database
3. Run the seed script:

```bash
cd makeit-be
node scripts/seedDishes.js
```

This will create 6 sample dishes with different categories:
- Margherita Pizza
- Chicken Shawarma  
- Caesar Salad
- Beef Burger
- Sushi Roll
- Chocolate Cake

Each dish includes:
- Name, description, category
- Price and rating
- Sample image URL
- Ingredients list
- Nutritional information
- Dietary tags

## Testing the Search

After seeding, you can test the dishes search in the app:
1. Go to Search tab
2. Select "Dishes" tab
3. Try searching for terms like "pizza", "chicken", "salad", etc.
4. Or leave search empty to see all dishes