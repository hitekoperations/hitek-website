# Activities Table Schema

## Database Table: `activities`

Create this table in your Supabase database with the following columns:

### Columns:

1. **id** (bigint, primary key, auto-increment)
   - Unique identifier for each activity

2. **type** (text, not null)
   - Type of activity (e.g., 'product_created', 'product_updated', 'product_deleted', 'order_fulfilled', 'order_cancelled', 'inventory_updated', 'user_created', 'bulk_import')

3. **action** (text, not null)
   - Human-readable action description (e.g., 'Created new product', 'Updated order status')

4. **user_id** (bigint, nullable)
   - ID of the CMS user who performed the action (references cmsusers table)

5. **user_name** (text, nullable)
   - Name/username of the user who performed the action (for quick display)

6. **user_role** (text, nullable)
   - Role of the user (admin, inventory_manager, order_manager)

7. **entity_type** (text, nullable)
   - Type of entity affected (e.g., 'product', 'order', 'inventory', 'user')

8. **entity_id** (text, nullable)
   - ID of the affected entity (e.g., product ID, order ID)

9. **entity_name** (text, nullable)
   - Name/title of the affected entity (e.g., product name, order number)

10. **details** (jsonb, nullable)
    - Additional details about the activity (e.g., product details, order details, changes made)
    - Stored as JSON for flexibility

11. **created_at** (timestamp, default: now())
    - When the activity occurred

### SQL to create the table:

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

-- Create index for faster queries
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_type ON activities(type);
```

