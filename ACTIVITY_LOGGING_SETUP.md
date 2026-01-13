# Activity Logging System - Setup Guide

## Overview
This system automatically logs all CMS activities (product creation, order updates, inventory changes, etc.) and displays them in the Recent Activity page with detailed modals.

## Database Setup

### 1. Create the Activities Table in Supabase

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE activities (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id BIGINT,
  user_name TEXT,
  user_role TEXT,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_type ON activities(type);
```

## How It Works

### Backend Activity Logging

The system automatically logs activities when:

1. **Product Created** (`product_created`)
   - When: Admin or Inventory Manager creates a new product
   - Logs: Product name, brand, price, stock, category

2. **Product Updated** (`product_updated`)
   - When: Product details are modified
   - Logs: Product name, changes made, updated fields

3. **Bulk Import** (`bulk_import`)
   - When: Products are imported via CSV
   - Logs: Number of products imported, category, success/failure count

4. **Order Status Updated** (`order_fulfilled`, `order_cancelled`, `order_updated`)
   - When: Order status changes (fulfilled, cancelled, etc.)
   - Logs: Order ID, previous status, new status

5. **Inventory Updated** (`inventory_updated`)
   - When: Stock quantity is updated (via product update)
   - Logs: Product details, stock changes

### User Tracking

The system tracks who performed each action by:
- Reading user info from request headers (`X-CMS-User-Id`, `X-CMS-User-Name`, `X-CMS-User-Role`)
- Storing user ID, name, and role with each activity
- Displaying the user who performed the action in the activity log

### Frontend Integration

1. **Recent Activity Page** (`/cms/recent-activity`)
   - Fetches activities from `/api/cms/activities`
   - Displays activities with icons and colors based on type
   - Shows relative timestamps (e.g., "2 hours ago", "Just now")
   - Click any activity to view detailed modal

2. **Detail Modal**
   - Shows full activity information
   - Displays entity details (product name, order ID, etc.)
   - Shows JSON details for complex activities
   - Includes full timestamp and user information

## API Endpoints

### GET `/api/cms/activities`
Returns all activities, ordered by most recent first.

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": 1,
    "type": "product_created",
    "action": "Created new laptop: MacBook Air 15\"",
    "user_id": 1,
    "user_name": "admin",
    "user_role": "admin",
    "entity_type": "product",
    "entity_id": "123",
    "entity_name": "MacBook Air 15\"",
    "details": {
      "category": "laptop",
      "brand": "Apple",
      "price": "250000",
      "stock": "25"
    },
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

### GET `/api/cms/activities/:id`
Returns a single activity by ID.

## Adding Activity Logging to New Endpoints

To add activity logging to a new endpoint:

1. Import the helper function:
```javascript
const { logActivity } = require('./activities');
```

2. Call `logActivity` after a successful operation:
```javascript
await logActivity({
  type: 'your_activity_type',
  action: 'Human-readable action description',
  entityType: 'product', // or 'order', 'inventory', etc.
  entityId: entity.id,
  entityName: entity.name,
  details: {
    // Any additional details as JSON
  },
}, req); // Pass req to extract user info
```

## Frontend: Sending User Headers

When making API calls from CMS pages, include user headers:

```javascript
const cmsUser = JSON.parse(window.localStorage.getItem('cmsUser') || '{}');

const response = await fetch('https://hitek-server-uu0f.onrender.com/api/products', {
  method: 'POST',
  headers: {
    'X-CMS-User-Id': cmsUser.id || '',
    'X-CMS-User-Name': cmsUser.username || cmsUser.name || '',
    'X-CMS-User-Role': cmsUser.role || '',
  },
  body: formData,
});
```

## Activity Types

Current activity types:
- `product_created` - New product added
- `product_updated` - Product modified
- `product_deleted` - Product removed
- `bulk_import` - Products imported via CSV
- `order_fulfilled` - Order marked as completed
- `order_cancelled` - Order cancelled
- `order_updated` - Order status changed
- `inventory_updated` - Stock quantity changed
- `user_created` - New CMS user created

## Notes

- Activity logging is non-blocking - if logging fails, the main operation still succeeds
- Activities are stored with full details in JSONB format for flexibility
- The system automatically determines icons and colors based on activity type
- Timestamps are displayed in relative format (e.g., "Just now", "10 mins ago")
- Only admin users can access the Recent Activity page

