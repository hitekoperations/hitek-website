const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { logActivity } = require('./activities');

const supabaseUrl = process.env.SUPABASE_URL || 'https://svyrkggjjkbxsbvumfxj.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2eXJrZ2dqamtieHNidnVtZnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODgyNTEsImV4cCI6MjA3Nzg2NDI1MX0.1aRKA1GT8nM2eNKF6-bqQV9K40vP7cRSxuj-QtbpO0g';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Generate a unique voucher code
const generateVoucherCode = (type, value) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  if (type === 'price') {
    return `RS${value}${random}`;
  } else {
    return `SAVE${value}${random}`;
  }
};

// Get all vouchers
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch vouchers:', error);
      return res.status(500).json({ error: 'Failed to fetch vouchers', details: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error('Get vouchers error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get single voucher by code
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Voucher not found' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Get voucher by code error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Create a new voucher
router.post('/', async (req, res) => {
  try {
    const { type, value, code, description, expires_at } = req.body;
    const userId = req.headers['x-cms-user-id'] ? parseInt(req.headers['x-cms-user-id']) : null;
    const userName = req.headers['x-cms-user-name'] || null;

    // Validate type
    if (!type || !['price', 'percentage'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "price" or "percentage"' });
    }

    // Validate value
    const numValue = parseFloat(value);
    if (!numValue || numValue <= 0) {
      return res.status(400).json({ error: 'Value must be a positive number' });
    }

    // Validate percentage range
    if (type === 'percentage' && (numValue < 1 || numValue > 100)) {
      return res.status(400).json({ error: 'Percentage must be between 1 and 100' });
    }

    // Generate code if not provided
    let voucherCode = code;
    if (!voucherCode || !voucherCode.trim()) {
      voucherCode = generateVoucherCode(type, Math.floor(numValue));
    } else {
      voucherCode = voucherCode.trim().toUpperCase();
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from('vouchers')
      .select('code')
      .eq('code', voucherCode)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Voucher code already exists' });
    }

    // Create voucher
    const voucherData = {
      code: voucherCode,
      type,
      value: numValue,
      description: description || null,
      expires_at: expires_at || null,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('vouchers')
      .insert(voucherData)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to create voucher:', error);
      return res.status(500).json({ error: 'Failed to create voucher', details: error.message });
    }

    // Log activity
    await logActivity({
      type: 'voucher_created',
      action: `Created ${type === 'price' ? `RS${numValue}` : `${numValue}%`} voucher: ${voucherCode}`,
      user_id: userId,
      user_name: userName,
      entity_type: 'voucher',
      entity_id: data.id.toString(),
      entity_name: voucherCode,
      details: { type, value: numValue, code: voucherCode },
    });

    res.status(201).json(data);
  } catch (err) {
    console.error('Create voucher error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Mark voucher as availed
router.patch('/:id/avail', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, order_id } = req.body;

    const { data: voucher, error: fetchError } = await supabase
      .from('vouchers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    if (voucher.is_availed) {
      return res.status(400).json({ error: 'Voucher has already been availed' });
    }

    // Check if expired
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Voucher has expired' });
    }

    const { data, error } = await supabase
      .from('vouchers')
      .update({
        is_availed: true,
        availed_by: user_id || null,
        availed_at: new Date().toISOString(),
        order_id: order_id || null,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to avail voucher:', error);
      return res.status(500).json({ error: 'Failed to avail voucher', details: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Avail voucher error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Delete a voucher
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-cms-user-id'] ? parseInt(req.headers['x-cms-user-id']) : null;
    const userName = req.headers['x-cms-user-name'] || null;

    const { data: voucher, error: fetchError } = await supabase
      .from('vouchers')
      .select('code')
      .eq('id', id)
      .single();

    if (fetchError || !voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete voucher:', error);
      return res.status(500).json({ error: 'Failed to delete voucher', details: error.message });
    }

    // Log activity
    await logActivity({
      type: 'voucher_deleted',
      action: `Deleted voucher: ${voucher.code}`,
      user_id: userId,
      user_name: userName,
      entity_type: 'voucher',
      entity_id: id.toString(),
      entity_name: voucher.code,
    });

    res.json({ message: 'Voucher deleted successfully' });
  } catch (err) {
    console.error('Delete voucher error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;
