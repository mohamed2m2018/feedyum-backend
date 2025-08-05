# Fake Data Scripts for Testing Notifications

This directory contains scripts to populate the database with fake data for testing the notification system.

## Scripts Available

### 🔔 Notification Scripts

#### `addFakeNotifications.js`
Adds fake app notifications to the database for testing notification badges and the notification system.

**Features:**
- Creates 3-5 notifications per user
- Various notification types: message, order, like, comment, follow, review, promotion
- Mix of read and unread notifications
- Realistic timestamps
- Proper sender/recipient relationships
- Deep linking data for navigation

**Run with:**
```bash
npm run fake-notifications
# or
node scripts/addFakeNotifications.js
```

#### `addFakeMessages.js`
Adds fake chat messages to the database for testing message notification badges.

**Features:**
- Creates realistic conversations between users
- Mix of read and unread messages
- Order-related and general chat messages
- Audio messages (10% of total)
- Realistic timestamps over the last 24 hours
- 70% unread rate for testing badges

**Run with:**
```bash
npm run fake-messages
# or
node scripts/addFakeMessages.js
```

#### `addAllFakeData.js`
Combined script that runs both notification and message scripts in sequence.

**Run with:**
```bash
npm run fake-data
# or
node scripts/addAllFakeData.js
```

#### `addFakeDataForChefMario.js`
Targeted script that adds fake notifications and messages specifically for Chef Mario for focused testing.

**Features:**
- Chef-specific notifications (orders, reviews, messages, follows, likes, comments)
- Customer messages with Italian restaurant context
- Order-related communications
- Realistic chef-customer interactions
- Clears existing data for Chef Mario before adding new data

**Run with:**
```bash
npm run fake-data-chef-mario
# or
node scripts/addFakeDataForChefMario.js
```

## What Gets Created

### Fake Notifications
- **Message notifications**: "Ahmed sent you a message about your order"
- **Order notifications**: "Your order #12345 is being prepared"
- **Like notifications**: "Omar liked your cooking video"
- **Comment notifications**: "Nour commented: 'This looks delicious!'"
- **Follow notifications**: "Mariam started following you"
- **Review notifications**: "Amira gave you 5 stars"
- **Promotion notifications**: "20% off on all orders today!"

### Fake Messages
- **Text messages**: Various realistic conversation messages
- **Audio messages**: Simulated voice messages with duration
- **Order-related messages**: Messages linked to specific orders
- **General chat**: Regular conversations between users

## Testing the Notification System

After running the scripts:

1. **Check Tab Badges**: Orders and Chat tabs should show notification count badges
2. **Real-time Updates**: Badges update automatically when new messages arrive
3. **Mark as Read**: Badges disappear when messages/notifications are read
4. **API Testing**: Use the notification API endpoints to test functionality

## Requirements

- At least 2 users in the database (for messages)
- MongoDB connection configured
- All models loaded properly

## Output Examples

```
📊 Summary:
- Total notifications: 45
- Unread: 32
- Read: 13

📋 By type:
- message: 12
- order: 8
- like: 7
- comment: 6
- follow: 5
- review: 4
- promotion: 3
```

```
📊 Summary:
- Total messages: 156
- Unread: 109
- Read: 47
- Order-related: 47
- Audio messages: 16

📱 Top users with unread messages:
- Ahmed Al-Mansouri: 15 unread
- Sarah Johnson: 12 unread
- Chef Mohammed: 11 unread
```

## API Endpoints to Test

After adding fake data, test these endpoints:

- `GET /api/chat/unread-counts` - Get unread message counts
- `GET /api/notifications` - Get user notifications
- `PUT /api/chat/chats/:senderId/read` - Mark chat as read
- `PUT /api/notifications/:id/read` - Mark notification as read

## Quick Start for Chef Mario Testing

To quickly test the notification system with Chef Mario's account:

```bash
npm run fake-data-chef-mario
```

This will create:
- **8 unread notifications** (orders, reviews, likes, etc.)
- **19 unread messages** from customers
- **11 order-related messages** for testing order notifications

## Cleanup

The scripts automatically clear existing notifications/messages before adding new ones. To manually clear:

```javascript
// Clear all notifications
await Notification.deleteMany({});

// Clear all messages
await Message.deleteMany({});
``` 