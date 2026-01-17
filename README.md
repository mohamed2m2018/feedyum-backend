# MakeIt Backend API

A Node.js/Express backend for a food-focused social platform with chef menus, ordering, and social features.

## Table of Contents

- [Authentication](#authentication)
- [API Routes](#api-routes)
  - [User Routes](#user-routes)
  - [Story Routes](#story-routes)
  - [Dish Routes](#dish-routes)
  - [Menu Routes](#menu-routes)
  - [Order Routes](#order-routes)
  - [Cart Routes](#cart-routes)
  - [Chat Routes](#chat-routes)
  - [Review Routes](#review-routes)
  - [Comment Routes](#comment-routes)
  - [Follow Routes](#follow-routes)
  - [Like Routes](#like-routes)
  - [Rating Routes](#rating-routes)
  - [Favorites Routes](#favorites-routes)
  - [Views Routes](#views-routes)
  - [Address Routes](#address-routes)
  - [Notifications Routes](#notifications-routes)
  - [Section Routes](#section-routes)
  - [Discover Routes](#discover-routes)
  - [Sharing Routes](#sharing-routes)

---

## Authentication

Most routes use **JWT authentication** via Passport.js. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

## API Routes

### User Routes
**Base**: `/api/user`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/` | User signup | Public |
| `POST` | `/login` | User login - returns JWT | Public |
| `GET` | `/` | Get logged-in user | Private |
| `PATCH` | `/` | Update logged-in user | Private |
| `DELETE` | `/` | Delete logged-in user | Private |
| `GET` | `/all` | Get all users | Private |
| `GET` | `/search` | Search users | Private |
| `GET` | `/semantic-search` | AI-powered semantic search | Private |
| `GET` | `/location` | Get all locations | Private |
| `GET` | `/tag/:tag` | Get user by tag | Public |
| `GET` | `/:id` | Get user by ID | Public |
| `GET` | `/:id/profile` | Get user profile with menu | Public |
| `GET` | `/chef/:chefId/profile` | Get chef profile with menu | Public |

---

### Story Routes
**Base**: `/api/story`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/add_story` | Create new story | Private |
| `POST` | `/upload-media` | Upload media for story | Private |
| `GET` | `/get-upload-url` | Get presigned R2 upload URL | Private |
| `POST` | `/report_story` | Report a story | Public |
| `GET` | `/stories` | Get all stories (paginated) | Private |
| `GET` | `/search` | Search stories | Public |
| `GET` | `/semantic-search` | AI-powered semantic search | Public |
| `DELETE` | `/stories` | Delete all stories | Private |
| `DELETE` | `/deleteById/:id` | Delete story by ID | Private |
| `GET` | `/author` | Get stories by logged-in user | Private |
| `GET` | `/following` | Get following users' stories | Public |
| `GET` | `/categories` | Get stories by subscribed categories | Public |
| `GET` | `/reviews` | Get review stories | Public |
| `GET` | `/:id` | Get story by ID | Private |
| `PATCH` | `/update_story` | Update a story | Private |
| `POST` | `/create-review-reel` | Create a review reel | Private |
| `GET` | `/reviews/dish/:dishId` | Get reviews for a dish | Public |

---

### Dish Routes
**Base**: `/api/dishes`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/` | Create a new dish | Private |
| `GET` | `/` | Get all dishes | Public |
| `GET` | `/menu/:menuId` | Get dishes by menu ID | Private |
| `GET` | `/chef/:chefId` | Get dishes by chef | Private |
| `GET` | `/category/:category` | Get dishes by category | Public |
| `GET` | `/search` | Search dishes | Public |
| `GET` | `/semantic-search` | AI-powered semantic search | Public |
| `GET` | `/:id` | Get dish by ID | Public |
| `PUT` | `/:id` | Update a dish | Private |
| `DELETE` | `/:id` | Delete a dish | Private |

---

### Menu Routes
**Base**: `/api/menus`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/` | Create menu (chefs only, one per chef) | Private |
| `GET` | `/` | Get all menus | Public |
| `GET` | `/chef/:chefId` | Get menu by chef ID | Public |
| `GET` | `/:menuId/categories` | Get menu sections/categories | Public |
| `GET` | `/:id` | Get menu by ID | Public |
| `PUT` | `/:id` | Update menu | Private |
| `DELETE` | `/:id` | Delete menu | Private |

---

### Order Routes
**Base**: `/api/orders`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/` | Create a new order | Private |
| `GET` | `/user` | Get current user's orders | Private |
| `GET` | `/user/:userId` | Get orders for a user | Private |
| `GET` | `/chef/stats` | Get chef dashboard stats | Private |
| `GET` | `/chef/analytics` | Get chef analytics | Private |
| `GET` | `/chef/:chefId` | Get orders for a chef | Private |
| `PUT` | `/:id/status` | Update order status | Private |
| `PUT` | `/:id/cancel` | Cancel order (pending/confirmed only) | Private |
| `GET` | `/:id` | Get order by ID | Private |

---

### Cart Routes
**Base**: `/api/cart`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/` | Get user's cart | Private |
| `POST` | `/add` | Add item to cart | Private |
| `POST` | `/update` | Update item quantity | Private |
| `POST` | `/remove` | Remove item from cart | Private |
| `POST` | `/clear` | Clear entire cart | Private |
| `POST` | `/checkout` | Checkout and create order | Private |

---

### Chat Routes
**Base**: `/api/chat`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/unread-counts` | Get unread message counts | Private |
| `PUT` | `/messages/:messageId/read` | Mark message as read | Private |
| `PUT` | `/chats/:senderId/read` | Mark chat as read | Private |
| `GET` | `/order-chats` | Get order-based chats | Private |
| `GET` | `/chats` | Get all chat participants | Private |
| `GET` | `/messages` | Get messages (with filters) | Private |
| `POST` | `/initiate` | Initiate a chat | Private |
| `POST` | `/message` | Send a message | Private |
| `PUT` | `/message/:messageId` | Edit a message | Private |
| `DELETE` | `/message/:messageId` | Delete a message | Private |

---

### Review Routes
**Base**: `/api/review`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/` | Add a review | Private |
| `GET` | `/` | Get reviews (with filters) | Public |
| `GET` | `/dish/:dishId` | Get dish reviews | Public |
| `GET` | `/stats` | Get review statistics | Public |
| `GET` | `/order/:orderId/status` | Get order review status | Private |
| `PUT` | `/:reviewId` | Update a review | Private |
| `DELETE` | `/:reviewId` | Delete a review | Private |
| `POST` | `/:reviewId/helpful` | Mark review as helpful | Private |
| `POST` | `/:reviewId/report` | Report a review | Private |

---

### Comment Routes
**Base**: `/api/comment`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/` | Get comments by post ID | Public |
| `GET` | `/count` | Get comments count | Public |
| `POST` | `/` | Add a comment | Private |
| `POST` | `/reply` | Add reply to comment | Private |
| `POST` | `/reply/delete` | Delete a reply | Private |
| `DELETE` | `/:postId/:commentId` | Delete a comment | Private |
| `POST` | `/like/:commentId` | Toggle like on comment | Private |
| `POST` | `/reply/like/:replyId` | Toggle like on reply | Private |

---

### Follow Routes
**Base**: `/api/follow`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/` | Follow a user | Private |
| `DELETE` | `/` | Unfollow a user | Private |
| `GET` | `/followers` | Get followers | Private |
| `GET` | `/following` | Get following | Private |
| `GET` | `/statistics/:userId` | Get follow statistics | Public |

---

### Like Routes
**Base**: `/api/like`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/:postId` | Like a story | Private |
| `DELETE` | `/:postId` | Unlike a story | Private |

---

### Rating Routes
**Base**: `/api/rating`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/:postId` | Add rating to a story | Private |
| `GET` | `/:postId` | Get rating for a story | Public |

---

### Favorites Routes
**Base**: `/api/favorites`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/add` | Add dish to favorites | Private |
| `DELETE` | `/remove/:dishId` | Remove from favorites | Private |

---

### Views Routes
**Base**: `/api/views`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/user/:userId` | Get views by user | Public |
| `GET` | `/user/:storyId` | Get views by post | Public |
| `POST` | `/` | Update views | Public |
| `GET` | `/` | Get views | Public |

---

### Address Routes
**Base**: `/api/address`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/add_address` | Add new address | Private |
| `PUT` | `/edit_address` | Edit address | Private |
| `GET` | `/` | Get user addresses | Private |
| `DELETE` | `/` | Remove address | Private |
| `POST` | `/current_location` | Set current location | Private |
| `POST` | `/geocode` | Reverse geocode coordinates | Private |

---

### Notifications Routes
**Base**: `/api/notifications`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/` | Get user notifications | Private |
| `PUT` | `/:notificationId/read` | Mark notification as read | Private |
| `PUT` | `/read-all` | Mark all as read | Private |

---

### Section Routes
**Base**: `/api/sections`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/` | Create a section | Private |
| `POST` | `/cleanup-duplicates` | Clean up duplicate sections | Private |
| `GET` | `/chef/:chefId` | Get sections by chef | Public |

---

### Discover Routes
**Base**: `/api/discover`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/batch` | Get all discover data (optimized) | Public |

**Query Params**: `lat`, `long`, `userId`

---

### Sharing Routes
**Base**: `/api/sharing`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/generate-link` | Generate shareable deep link | Private |

**Web Fallbacks** (all Public):

| Endpoint | Type |
|----------|------|
| `/reel/:contentId` | Reel |
| `/story/:contentId` | Story |
| `/review-reel/:contentId` | Review Reel |
| `/profile/:contentId` | Profile |
| `/user/:contentId` | User Profile |
| `/u/:contentId` | Profile by Username |
| `/chef/:contentId` | Chef Profile |
| `/chef/:contentId/menu` | Chef Menu |
| `/menu/:contentId` | Menu |
| `/menu/:menuId/item/:contentId` | Menu Item |
| `/dish/:contentId` | Dish |
| `/discover/:contentId?` | Discover |
| `/trending` | Trending |
| `/search/:contentId?` | Search |
| `/hashtag/:contentId` | Hashtag |
| `/live/:contentId?` | Live Stream |
| `/post/:contentId` | Post |
| `/sound/:contentId` | Sound |
| `/order/:contentId/track` | Order Tracking |
| `/chat/:contentId?` | Chat |

---

## Implementation Techniques

This section documents the core architectural patterns and technical approaches used throughout the backend.

---

### 1. Recommendation & Feed Algorithm

The story feed uses a **multi-factor scoring system** to personalize content for each user. Every story is assigned a score between 0-150+ points based on six factors:

#### Scoring Factors

| Factor | Points | Description |
|--------|--------|-------------|
| **Recency** | 0-40 | Newer content scores higher. Uses exponential decay with a 24-hour half-life. A story posted 24 hours ago gets half the points of a brand new story. |
| **View History** | -30 to +15 | Previously viewed stories receive a **-30 penalty** to bury seen content. Unseen stories matching the user's preferred categories get a **+15 bonus**. |
| **Location Proximity** | 0-30 | Stories from nearby chefs score higher. Within 5km = 30pts, 5-15km = 25pts, 15-30km = 20pts, 30-50km = 15pts, 50-80km = 8pts. |
| **Engagement** | 0-15 | Popular stories with more likes (up to 8pts) and views (up to 7pts) are boosted. |
| **Randomness** | 0-10 | A random factor prevents the feed from becoming stale or predictable. |
| **Quality** | 0-10 | Stories with longer captions (+2), attached dishes (+3), or review mode (+3) get bonuses. |

#### User Interest Detection

The system tracks **implicit user preferences** by analyzing the last 50 stories a user has watched. Categories that appear 2+ times in their viewing history are marked as "preferred categories" and receive boosted scores in future recommendations.

#### Bucketing & Interleaving

After scoring, stories are organized into **four priority buckets**:

```
┌─────────────────────────────────────────────────────────────┐
│                    FEED GENERATION FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [All Stories] ──► [Score Each] ──► [Sort by Score]       │
│                                                              │
│                           │                                  │
│                           ▼                                  │
│   ┌────────────────────────────────────────────────────┐    │
│   │              BUCKET ASSIGNMENT                      │    │
│   ├────────────────────────────────────────────────────┤    │
│   │  🔥 Very Close: Score >80 OR distance ≤10km       │    │
│   │  ⭐ Close: Distance 10-50km                        │    │
│   │  📍 Nearby: Distance 50-150km                      │    │
│   │  🌐 Distant: Everything else + viewed content      │    │
│   └────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│   ┌────────────────────────────────────────────────────┐    │
│   │            PROBABILISTIC INTERLEAVING              │    │
│   ├────────────────────────────────────────────────────┤    │
│   │  60% from Very Close                               │    │
│   │  25% from Close                                    │    │
│   │  10% from Nearby                                   │    │
│   │   5% from Distant                                  │    │
│   └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Tiered Fallback System

When the user has exhausted all "hot" scored content, the system falls back to a **distance-sorted archive**. This ensures unlimited scrolling by progressively showing older or more distant content sorted purely by geographic proximity.

---

### 2. AI-Powered Semantic Search

The search system uses **vector embeddings** to understand the meaning behind search queries, enabling users to find content even when they don't use exact keywords.

#### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SEMANTIC SEARCH FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   User Query: "أكل صحي" (healthy food)                      │
│                           │                                  │
│                           ▼                                  │
│   ┌────────────────────────────────────────────────────┐    │
│   │          EMBEDDING GENERATION                       │    │
│   │  ────────────────────────────────────────────       │    │
│   │  Primary: OpenAI text-embedding-3-large             │    │
│   │           (3072 dimensions, best Arabic support)    │    │
│   │                                                     │    │
│   │  Fallback: Xenova/multilingual-e5-small             │    │
│   │           (local model if OpenAI unavailable)       │    │
│   │                                                     │    │
│   │  Cache: LRU Map (1000 entries max)                  │    │
│   └────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│   ┌────────────────────────────────────────────────────┐    │
│   │          VECTOR SEARCH                              │    │
│   │  ────────────────────────────────────────────       │    │
│   │  Primary: MongoDB (in-memory cosine similarity)    │    │
│   │  Threshold: 0.5+ similarity score required          │    │
│   └────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│   ┌────────────────────────────────────────────────────┐    │
│   │          DATA HYDRATION                             │    │
│   │  ────────────────────────────────────────────       │    │
│   │  IDs from vector search → Full documents from       │    │
│   │  MongoDB with populated relationships               │    │
│   └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

| Feature | Description |
|---------|-------------|
| **Multilingual Support** | Native Arabic understanding through multilingual embedding models. Queries like "كنتاكي" correctly map to "KFC", "chicken", "fried", etc. |
| **Hybrid Search** | Combines semantic results with traditional text search, giving priority to semantic matches while supplementing with keyword matches. |
| **Graceful Degradation** |If OpenAI fails, uses local embedding model. If all semantic fails, uses text search. |

---

### 3. Geospatial Distance Calculation

The system calculates distances between users and chefs using the **Haversine formula**, which accounts for Earth's curvature.

#### How It Works

1. **Multi-location Support**: Chefs can have multiple branch locations. The system calculates distance to the **nearest** branch.

2. **MongoDB Aggregation**: Distance calculations happen inside the database, enabling efficient sorting before pagination.

3. **Distance Tiers**: Results are tiered for feed scoring:

| Distance | Classification | Feed Weight |
|----------|---------------|-------------|
| 0-5 km | Very Close | Highest priority |
| 5-15 km | Close | High priority |
| 15-30 km | Nearby | Medium priority |
| 30-50 km | Moderate | Low priority |
| 50+ km | Distant | Lowest priority |

#### Application Areas

- **Feed Ranking**: Stories from nearby chefs appear higher in the feed
- **Dish Discovery**: Dishes are sorted by proximity when location is provided
- **Chef Filtering**: Users can filter to see only chefs within a certain radius

---

### 4. Real-Time Messaging System

The chat system uses **Socket.io** for real-time bidirectional communication between users and chefs.

#### Event Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    SOCKET.IO EVENT FLOW                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   Customer                    Server                    Chef  │
│      │                          │                         │   │
│      │──── join(userId) ───────►│                         │   │
│      │◄─── chatHistory ─────────│                         │   │
│      │                          │                         │   │
│      │── sendMessage ──────────►│                         │   │
│      │                          │──── newMessage ────────►│   │
│      │                          │──── push notification ─►│   │
│      │                          │                         │   │
│      │                          │◄─── markMessagesRead ───│   │
│      │◄─── unreadCountsUpdate ──│                         │   │
│      │                          │                         │   │
└──────────────────────────────────────────────────────────────┘
```

#### Message Types

| Type | Description |
|------|-------------|
| **Text** | Standard text messages |
| **Audio** | Voice messages with duration tracking |
| **Order-linked** | Messages associated with a specific order |

#### Features

- **Unread Tracking**: Separate counts for order-related and general chat messages
- **Read Receipts**: Messages track `isRead` status and `readAt` timestamp
- **Soft Delete**: Messages are marked as deleted rather than removed
- **Edit History**: Messages track `isEdited` flag for transparency

---

### 5. Order Processing System

Order creation involves multiple validation steps and triggers notifications across channels.

#### Order Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    ORDER CREATION FLOW                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   ① VALIDATION                                                │
│   ├── Verify chef exists and is active                       │
│   ├── Verify all dishes exist and get current prices          │
│   └── Validate delivery address format                        │
│                                                               │
│   ② GEOGRAPHIC VALIDATION                                     │
│   ├── Extract city from delivery address                      │
│   ├── Map districts to governorates (Cairo/Giza mapping)      │
│   └── Check if chef has active branches in delivery area      │
│                                                               │
│   ③ PRICE CALCULATION                                         │
│   ├── Sum: dish.price × quantity for each item               │
│   ├── Add: 2% service fee                                     │
│   └── Add: delivery fee (set by chef)                         │
│                                                               │
│   ④ ORDER CREATION                                            │
│   └── Save order with status: "pending"                       │
│                                                               │
│   ⑤ MULTI-CHANNEL NOTIFICATIONS                               │
│   ├── Push notification to chef (new order alert)             │
│   ├── Push notification to customer (order confirmed)         │
│   └── Socket event to chef dashboard (real-time update)       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

#### Egyptian Geographic Mapping

The system includes smart mapping of Egyptian districts to their governorates:

| Cairo Districts | Giza Districts |
|-----------------|----------------|
| Nasr City, مدينة نصر | Dokki, الدقي |
| Maadi, المعادي | Mohandessin, المهندسين |
| Heliopolis, مصر الجديدة | Haram, الهرم |
| New Cairo, القاهرة الجديدة | 6 October, أكتوبر |
| Zamalek, الزمالك | Sheikh Zayed, الشيخ زايد |

---

### 6. Push Notification System

All push notifications are handled by **OneSignal** with support for bilingual content and deep linking.

#### Notification Categories

| Category | Examples |
|----------|----------|
| **Order Updates** | New order, confirmed, preparing, ready, delivered, cancelled |
| **Social** | New follower, likes, comments, mentions |
| **Chat** | New message (with sender name and avatar) |
| **Chef Dashboard** | New review, rating, menu engagement |

#### Deep Link Structure

Every notification includes a deep link for navigation:

```
┌─────────────────────────────────────────────────────────────┐
│                    DEEP LINK PATTERNS                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Content Type          Deep Link Format                      │
│  ────────────────      ──────────────────────────────        │
│  Reel/Story            makeit://reel/{storyId}               │
│  Chef Profile          makeit://chef/{chefId}                │
│  Chef Menu             makeit://chef/{chefId}/menu           │
│  Dish                  makeit://dish/{dishId}                │
│  Order Tracking        makeit://order/{orderId}/track        │
│  Chat                  makeit://chat/{chatId}                │
│  Menu Item             makeit://menu/{menuId}/item/{itemId}  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Bilingual Support

Notifications include both English and Arabic content, allowing the app to display the appropriate language based on user settings.

---

### 7. Authentication & Middleware

#### Authentication Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Strategy | Passport.js JWT | Validate Bearer tokens |
| Storage | MongoDB User collection | Lookup user by token payload |
| Transport | Authorization header | `Bearer <token>` format |

#### Custom Middleware

| Middleware | Purpose |
|------------|---------|
| **checkChefPaymentStatus** | Blocks chef actions if wallet balance is below -2000 EGP. Returns 402 status with payment details. |
| **requestTimeout** | Prevents hanging requests by enforcing time limits (e.g., 18s for semantic search). |

---

### 8. Data Hydration Pattern

To optimize feed performance, the system uses a **batch query with order preservation** pattern:

```
┌──────────────────────────────────────────────────────────────┐
│                    DATA HYDRATION FLOW                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   ① Generate ordered list of story IDs (from algorithm)      │
│                           │                                   │
│                           ▼                                   │
│   ② Extract page of IDs (e.g., IDs 0-9 for page 1)           │
│                           │                                   │
│                           ▼                                   │
│   ③ Batch query MongoDB (returns unordered)                  │
│      └── Populate: author, dishes                             │
│                           │                                   │
│                           ▼                                   │
│   ④ Restore original order using ID→Document Map             │
│                           │                                   │
│                           ▼                                   │
│   ⑤ Batch hydrate additional fields:                         │
│      ├── currentUserLiked (from Likes collection)             │
│      └── author.averageDishRating (from Dish aggregation)     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

This approach minimizes database queries by batching operations while maintaining the precise ordering from the recommendation algorithm.

---

### 9. File Upload Strategy

Media uploads use **Cloudflare R2** with presigned URLs for secure, direct client-to-storage uploads.

#### Upload Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    FILE UPLOAD FLOW                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   Client                    Server                    R2      │
│      │                         │                       │      │
│      │── GET /get-upload-url ─►│                       │      │
│      │◄─ { uploadUrl, key } ───│                       │      │
│      │                         │                       │      │
│      │──── PUT (direct upload) ───────────────────────►│      │
│      │◄─── 200 OK ─────────────────────────────────────│      │
│      │                         │                       │      │
│      │── POST /add_story ─────►│                       │      │
│      │   { media: [key] }      │                       │      │
│      │                         │── Verify file exists ►│      │
│      │◄─── Story Created ──────│                       │      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

#### Benefits

- **No Server Bandwidth**: Files go directly to R2, not through the API server
- **Secure**: Presigned URLs expire after 1 hour and include content-type restrictions
- **Large Files**: R2 handles multipart uploads for large videos automatically

---

### 10. MongoDB Aggregation Patterns

Complex queries use **MongoDB Aggregation Pipelines** for efficient server-side processing.

#### Common Patterns Used

| Pattern | Use Case |
|---------|----------|
| **$lookup with nested pipeline** | Order-chat sorting: Join orders with latest message, sort by message timestamp |
| **$facet** | Pagination with count: Get both total count and paginated data in one query |
| **$group with $avg** | Chef analytics: Calculate average ratings across all dishes |
| **$addFields with Haversine** | Distance calculation: Compute km distance in the database |
| **$unwind + $min** | Multi-location: Find nearest branch from array of locations |

---

## Project Structure

```
makeit-be/
├── controllers/       # Route handlers organized by feature
├── middleware/        # Auth, timeout, payment status checks
├── models/           # Mongoose schemas
├── routes/           # Express routers
├── services/         # Business logic (notifications, search, etc.)
├── utils/            # Helper functions
├── validations/      # Input validation schemas
├── config/           # Configuration files
└── server.js         # Entry point
```

---

## Environment Variables

See `.env.example` for required variables including:
- Database connection strings
- JWT secrets
- Cloud storage credentials
- API keys for external services

---

## Running the Server

```bash
npm install
npm start
```

Development mode with auto-reload:
```bash
npm run dev
```
