# Orders Table - Voucher Support Update

## Database Schema Update

To support voucher codes in orders, you need to add the following columns to your `orders` table in Supabase:

### New Columns to Add:

1. **discount** (numeric, default: 0)
   - The discount amount applied from the voucher
   - Example: If voucher is RS100000, discount = 100000
   - Example: If voucher is 70% and subtotal is 100000, discount = 70000

2. **voucher_code** (text, nullable)
   - The voucher code that was used (e.g., "RS500", "SAVE10")
   - NULL if no voucher was used

3. **voucher_id** (bigint, nullable)
   - The ID of the voucher from the vouchers table
   - References vouchers.id
   - NULL if no voucher was used

### SQL to Update the Table:

```sql
-- Add discount column (if it doesn't exist)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;

-- Add voucher_code column (if it doesn't exist)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS voucher_code TEXT;

-- Add voucher_id column (if it doesn't exist)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS voucher_id BIGINT;

-- Optional: Add index for voucher lookups
CREATE INDEX IF NOT EXISTS idx_orders_voucher_id ON orders(voucher_id);
CREATE INDEX IF NOT EXISTS idx_orders_voucher_code ON orders(voucher_code);
```

### Notes:

- The `discount` column stores the actual discount amount applied (not the voucher value)
- For price-based vouchers: discount = voucher value (capped at subtotal)
- For percentage-based vouchers: discount = (subtotal × voucher percentage) / 100
- The `voucher_id` links the order to the voucher record for tracking
- The `voucher_code` is stored for easy reference without needing to join tables
