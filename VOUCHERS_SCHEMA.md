# Vouchers Table Schema

## Database Table: `vouchers`

Create this table in your Supabase database with the following columns:

### Columns:

1. **id** (bigint, primary key, auto-increment)
   - Unique identifier for each voucher

2. **code** (text, not null, unique)
   - The voucher code that users will enter (e.g., "RS500", "SAVE10", "DISCOUNT25")

3. **type** (text, not null)
   - Type of voucher: either 'price' or 'percentage'
   - 'price': Fixed amount discount (e.g., RS500 off)
   - 'percentage': Percentage discount (e.g., 10% off)

4. **value** (numeric, not null)
   - For 'price' type: The discount amount (e.g., 500 for RS500)
   - For 'percentage' type: The percentage value (e.g., 10 for 10%, 25 for 25%)

5. **is_availed** (boolean, default: false)
   - Whether the voucher has been used/availed
   - false = Valid (not used yet)
   - true = Availed (already used)

6. **availed_by** (bigint, nullable)
   - ID of the user who used the voucher (references users table)
   - NULL if not availed yet

7. **availed_at** (timestamp, nullable)
   - When the voucher was used/availed
   - NULL if not availed yet

8. **order_id** (bigint, nullable)
   - ID of the order where this voucher was applied (references orders table)
   - NULL if not availed yet

9. **expires_at** (timestamp, nullable)
   - Optional expiration date for the voucher
   - NULL means no expiration

10. **description** (text, nullable)
    - Optional description or notes about the voucher

11. **created_at** (timestamp, default: now())
    - When the voucher was created

12. **created_by** (bigint, nullable)
    - ID of the CMS user who created the voucher (references cmsusers table)
    - NULL if created by system

### SQL to create the table:

```sql
CREATE TABLE vouchers (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('price', 'percentage')),
  value NUMERIC NOT NULL CHECK (value > 0),
  is_availed BOOLEAN DEFAULT FALSE,
  availed_by BIGINT,
  availed_at TIMESTAMP,
  order_id BIGINT,
  expires_at TIMESTAMP,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by BIGINT
);

-- Create indexes for faster queries
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_is_availed ON vouchers(is_availed);
CREATE INDEX idx_vouchers_type ON vouchers(type);
CREATE INDEX idx_vouchers_created_at ON vouchers(created_at DESC);
CREATE INDEX idx_vouchers_expires_at ON vouchers(expires_at);

-- Optional: Add foreign key constraints if you want referential integrity
-- ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_availed_by FOREIGN KEY (availed_by) REFERENCES users(id);
-- ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_order_id FOREIGN KEY (order_id) REFERENCES orders(id);
-- ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_created_by FOREIGN KEY (created_by) REFERENCES cmsusers(id);
```

### Notes:

- The `code` column is unique to prevent duplicate voucher codes
- The `type` column uses a CHECK constraint to ensure only 'price' or 'percentage' values
- The `value` column uses a CHECK constraint to ensure positive values
- For percentage vouchers, the value should be between 1 and 100
- The `is_availed` boolean makes it easy to filter valid vs availed vouchers
- Indexes are created for common query patterns (code lookup, status filtering, etc.)
