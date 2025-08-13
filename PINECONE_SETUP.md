# Pinecone Vector Search Setup Guide

This guide will help you set up Pinecone for high-performance semantic search in your FoodTok application.

## Prerequisites

1. **Pinecone Account**: Sign up at [pinecone.io](https://pinecone.io)
2. **Node.js Dependencies**: Install the Pinecone client
3. **Existing Embeddings**: Your MongoDB should have embeddings generated

## Step 1: Install Dependencies

```bash
cd makeit-be
npm install @pinecone-database/pinecone
```

## Step 2: Environment Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Add your Pinecone API key to `.env`:
```bash
# Get this from your Pinecone dashboard
PINECONE_API_KEY=your-pinecone-api-key-here

# Optional: Customize index names (defaults will be used if not specified)
PINECONE_DISHES_INDEX=dishes-index
PINECONE_USERS_INDEX=users-index
PINECONE_STORIES_INDEX=stories-index
```

## Step 3: Create Pinecone Indexes

Run the setup script to create the required indexes:

```bash
npm run pinecone:setup
```

This will create three indexes:
- `dishes-index` (384 dimensions, cosine similarity)
- `users-index` (384 dimensions, cosine similarity)  
- `stories-index` (384 dimensions, cosine similarity)

## Step 4: Migrate Existing Data

Migrate your existing embeddings from MongoDB to Pinecone:

```bash
# Migrate all data types
npm run pinecone:migrate

# Or migrate specific types
npm run pinecone:migrate:dishes
npm run pinecone:migrate:users
npm run pinecone:migrate:stories
```

## Step 5: Verify Setup

Check that your indexes are created and populated:

1. **Pinecone Dashboard**: Visit your Pinecone dashboard to see the indexes
2. **API Test**: The migration script will show success/failure messages
3. **Search Test**: Try a search query to verify it's working

## Performance Benefits

After setup, you should see:

| Metric | Before (MongoDB) | After (Pinecone) |
|--------|------------------|------------------|
| Search Speed | 500ms - 2s | 10-50ms |
| Scalability | Poor (O(n)) | Excellent |
| Memory Usage | High | Low |
| Concurrent Users | Limited | High |

## API Changes

The API endpoints remain the same, but now support cursor-based pagination:

### Before (Page-based):
```javascript
GET /api/dishes/semantic-search?searchString=pasta&page=2&limit=10
```

### After (Cursor-based):
```javascript
GET /api/dishes/semantic-search?searchString=pasta&cursor=0.85&limit=10
```

### Response Format:
```json
{
  "success": true,
  "data": {
    "dishes": [...],
    "pagination": {
      "hasMore": true,
      "nextCursor": 0.82,
      "limit": 10
    },
    "searchType": "semantic-pinecone"
  }
}
```

## Real-time Updates

When dishes/users/stories are created or updated, they need to be synced to Pinecone:

```javascript
// In your create/update controllers
const pineconeDataMigration = require('../services/pineconeDataMigration');

// After creating/updating a dish
await pineconeDataMigration.syncDish(dish._id);

// When deleting a dish
await pineconeDataMigration.removeDish(dish._id);
```

## Monitoring

### Index Statistics
```javascript
const vectorSearchService = require('./services/vectorSearchService');

// Get index stats
const stats = await vectorSearchService.getIndexStats('dishes');
console.log('Index stats:', stats);
```

### Search Performance
Monitor search response times and adjust similarity thresholds as needed:

```javascript
// In semanticSearchService.js
this.similarityThreshold = 0.2; // Adjust based on your data
```

## Troubleshooting

### Common Issues

1. **"Index not found" error**
   - Run `npm run pinecone:setup` to create indexes
   - Check your index names in environment variables

2. **"No results found" error**
   - Run `npm run pinecone:migrate` to populate indexes
   - Check that your embeddings exist in MongoDB

3. **Slow search performance**
   - Verify you're using Pinecone (check `searchType` in response)
   - Check your similarity threshold (lower = more results)

4. **API rate limits**
   - Pinecone has rate limits on free tier
   - Consider upgrading or adding delays between requests

### Debug Mode

Enable debug logging:

```javascript
// In vectorSearchService.js
console.log('🔍 Searching with vector:', queryEmbedding.slice(0, 5));
console.log('✅ Found results:', results.length);
```

## Cost Estimation

Pinecone pricing (as of 2024):
- **Starter (Free)**: 1 index, 100K vectors, 5 queries/sec
- **Standard**: $70/month for 1M vectors, 100 queries/sec
- **Enterprise**: Custom pricing

For 10K dishes + 5K users + 20K stories = 35K vectors total
- **Free tier**: Sufficient for development/small production
- **Standard tier**: Recommended for production with growth

## Migration Rollback

If you need to rollback to MongoDB-only search:

1. **Environment**: Remove `PINECONE_API_KEY` from `.env`
2. **Code**: The system will automatically fallback to MongoDB search
3. **Cleanup**: Optionally delete Pinecone indexes to stop billing

## Next Steps

1. **Monitor Performance**: Track search response times and user engagement
2. **Optimize Thresholds**: Adjust similarity thresholds based on user feedback
3. **Scale Up**: Consider upgrading Pinecone plan as your data grows
4. **Advanced Features**: Explore Pinecone's filtering and metadata capabilities

## Support

- **Pinecone Docs**: [docs.pinecone.io](https://docs.pinecone.io)
- **Community**: Pinecone Discord/Forum
- **Issues**: Check the troubleshooting section above