# Chef Test Data & Credentials

This document contains information about the test data and credentials for the food ordering system.

## 🚀 Setup Scripts

### 1. Create Comprehensive Test Data
```bash
cd makeit-be
node scripts/createChefTestData.js
```

This script creates:
- ✅ 5 Sample chefs with complete profiles
- ✅ 2 Sample users for testing orders
- ✅ Menus for each chef
- ✅ Menu sections (Appetizers, Main Course, etc.)
- ✅ Authentic dishes for each chef based on their cuisine
- ✅ Sample orders for testing

### 2. Setup Menus for Existing Chefs
```bash
cd makeit-be
node scripts/setupChefMenus.js
```

This script:
- ✅ Finds all existing chefs in the database
- ✅ Creates menus for chefs who don't have one
- ✅ Adds sample dishes to each chef's menu
- ✅ Creates proper menu sections

### 3. Test Data Verification
```bash
cd makeit-be
node scripts/testChefOrders.js
```

This script:
- ✅ Lists all chefs in the database
- ✅ Shows all menus and their owners
- ✅ Displays sample dishes
- ✅ Shows existing orders

## 👨‍🍳 Test Chef Credentials

### Mario Giuseppe (Italian Cuisine)
- **Email:** mario@foodtok.com
- **Password:** password123
- **Specialties:** Pasta, Pizza, Italian classics
- **Sample Dishes:** Spaghetti Carbonara, Margherita Pizza, Osso Buco, Tiramisu

### Isabella Rodriguez (Spanish Cuisine)
- **Email:** isabella@foodtok.com
- **Password:** password123
- **Specialties:** Spanish and Mediterranean
- **Sample Dishes:** Paella Valenciana, Patatas Bravas, Gazpacho

### Chen Wei (Asian Cuisine)
- **Email:** chen@foodtok.com
- **Password:** password123
- **Specialties:** Chinese and Asian fusion
- **Sample Dishes:** Kung Pao Chicken, Xiaolongbao, Mapo Tofu

### Ahmed Hassan (Middle Eastern Cuisine)
- **Email:** ahmed@foodtok.com
- **Password:** password123
- **Specialties:** Middle Eastern and Mediterranean
- **Sample Dishes:** Lamb Shawarma, Hummus Platter, Baklava

### Sophie Laurent (French Cuisine)
- **Email:** sophie@foodtok.com
- **Password:** password123
- **Specialties:** French pastry and fine dining
- **Sample Dishes:** Coq au Vin, Crème Brûlée, French Onion Soup

## 👤 Test User Credentials

### John Smith
- **Email:** john@foodtok.com
- **Password:** password123
- **Type:** Regular user (for placing orders)

### Sarah Johnson
- **Email:** sarah@foodtok.com
- **Password:** password123
- **Type:** Regular user (for placing orders)

## 🎯 Testing Scenarios

### 1. Menu Browsing
1. Login as any chef
2. Navigate to chef dashboard
3. View menu management
4. See dishes organized by sections

### 2. Order Placement
1. Login as a regular user (John or Sarah)
2. Browse chef menus
3. Add dishes to cart
4. Place orders

### 3. Order Management
1. Login as a chef
2. Navigate to order management
3. View incoming orders
4. Update order status
5. Set delivery fees

### 4. Reel Integration
1. View reels with attached dishes
2. Click on dish images
3. Navigate to chef menu
4. Auto-scroll to specific dishes

## 📊 Database Structure

After running the scripts, you'll have:

```
Users (Chefs + Regular Users)
├── Menus (One per chef)
│   ├── Sections (Appetizers, Main Course, etc.)
│   └── Dishes (3-4 per chef, authentic to their cuisine)
└── Orders (Sample orders between users and chefs)
```

## 🔧 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running on `mongodb://localhost:27017/foodtok`
- Update connection string in scripts if needed

### Missing Dependencies
```bash
npm install mongoose bcryptjs
```

### Permission Issues
- Ensure the scripts have proper file permissions
- Run with `node` command from the `makeit-be` directory

## 🎉 Success Indicators

After running the scripts successfully, you should see:
- ✅ Chefs can login and access their dashboards
- ✅ Each chef has a complete menu with dishes
- ✅ Users can browse chef menus and place orders
- ✅ Dishes in reels properly link to chef menus
- ✅ Order management system works end-to-end

## 📱 App Testing Flow

1. **Reel Discovery**: View reels → Click dish images → Navigate to chef menu
2. **Menu Browsing**: Browse dishes → Add to cart → Manage quantities
3. **Order Placement**: Checkout → Place order → Track status
4. **Chef Management**: Login as chef → Manage orders → Set delivery fees
5. **Communication**: Chat with chefs about orders (when implemented)

This test data provides a complete foundation for testing all aspects of the food ordering system!