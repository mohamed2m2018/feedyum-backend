# Test Data Generator

This directory contains scripts to generate realistic test data for the Tikto food ordering app.

## 🎯 Order Test Data

The order test data generator creates comprehensive test scenarios including:

### Generated Data:
- **50 realistic orders** with different statuses
- **Multiple order statuses**: pending, accepted, completed, cancelled  
- **Realistic pricing**: subtotal, delivery fees, taxes
- **Delivery addresses**: Various realistic addresses with coordinates
- **Special instructions**: Customer notes and dietary requirements
- **Order items**: 1-4 dishes per order with quantities
- **Messages**: Chef-customer communication for each order

### Order Status Distribution:
- **Pending** (30%): New orders awaiting chef confirmation
- **Accepted** (30%): Orders confirmed and being prepared
- **Completed** (55%): Finished orders ready for delivery/pickup
- **Cancelled** (15%): Orders that couldn't be fulfilled

### Message Features:
- ✅ Initial order confirmation messages
- ✅ Status update notifications
- ✅ Customer responses (30% chance)
- ✅ Realistic timestamps (5-45 minutes after order)
- ✅ Order details formatting with emojis

## 🚀 Usage

### Prerequisites
Make sure you have:
1. Existing users in the database (both customers and chefs)
2. Existing menus and dishes for chefs
3. Running MongoDB instance

### Command Line Usage

```bash
# Navigate to backend directory
cd makeit-be

# Generate test data
npm run test-data:generate

# Clean test data
npm run test-data:clean

# Reset (clean + generate)
npm run test-data:reset

# Show help
npm run test-data
```

### Alternative Usage

```bash
# Direct script execution
node scripts/generateTestData.js generate
node scripts/generateTestData.js clean
node scripts/generateTestData.js reset
```

## 📊 Sample Output

```
🚀 Starting order test data generation...
💾 Saving 50 orders and 127 messages...
✅ Test data generation completed successfully!
📊 Generated:
    - 50 orders
    - 127 messages
    - Status distribution:
      • Pending: 15
      • Accepted: 15
      • Completed: 17
      • Cancelled: 3
```

## 🔧 Customization

You can modify the test data by editing `orderTestData.js`:

- **Number of orders**: Change the loop limit (currently 50)
- **Status distribution**: Modify the probability ranges
- **Sample addresses**: Add your own delivery locations
- **Special instructions**: Add custom customer notes
- **Message templates**: Customize chef-customer communication

## 🧹 Cleanup

Test orders are marked with "Test Order" in the `specialInstructions` field, making them easy to identify and clean up. The cleanup function only removes orders with this identifier, preserving real order data.

## ⚠️ Important Notes

1. **Database Connection**: Script uses `MONGODB_URI` environment variable or defaults to `mongodb://localhost:27017/makeit`
2. **Data Dependencies**: Requires existing users (customers and chefs) and menu items
3. **Test Identification**: All test orders include "Test Order" in special instructions for easy cleanup
4. **Realistic Timing**: Messages are spaced realistically (5-45 minutes apart)
5. **Safe Cleanup**: Only removes data marked as test data, never touches real orders

## 🔍 Verification

After running the script, you can verify the data in your app by:

1. Checking the Orders screen for different status types
2. Opening chat conversations to see realistic message threads
3. Viewing order details with proper pricing and addresses
4. Testing status transitions (if you're a chef user)

The test data provides a comprehensive foundation for testing all order-related functionality in your food delivery app! 