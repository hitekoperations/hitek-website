const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { logActivity } = require('./activities');
const nodemailer = require('nodemailer');

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

// Create email transporter (same logic as auth.js)
const createEmailTransporter = () => {
  const connectionOptions = {
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  };

  if (process.env.EMAIL_SERVICE === 'gmail' || process.env.EMAIL_USER?.includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      ...connectionOptions,
      pool: true,
      maxConnections: 1,
    });
  }

  if (process.env.EMAIL_SERVICE === 'sendgrid' || process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
      ...connectionOptions,
    });
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      ...connectionOptions,
    });
  }

  return null;
};

const emailTransporter = createEmailTransporter();

const normalizeStatus = (status) => {
  if (!status) return 'pending';
  return status.toString().toLowerCase();
};

const extractCustomerName = (order, user) => {
  if (!order && !user) return 'Guest User';

  const orderName =
    order?.customer_name ||
    [order?.first_name, order?.last_name].filter(Boolean).join(' ') ||
    order?.user_name ||
    order?.user_email;
  if (orderName && orderName.trim()) return orderName.trim();

  const userName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.name ||
    user?.email;
  if (userName && userName.trim()) return userName.trim();

  return 'Guest User';
};

const isPendingStatus = (status) => {
  const normalized = normalizeStatus(status);
  return normalized === 'pending' || normalized === 'in_progress';
};

const updateUserTotals = async (userId, delta) => {
  const toNumber = (value) => {
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
  };

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('totalorders, pending, completed')
    .eq('id', userId)
    .single();

  if (userError) {
    console.error('Failed to fetch user totals:', userError);
    return;
  }

  const currentTotals = {
    totalorders: toNumber(userData.totalorders),
    pending: toNumber(userData.pending),
    completed: toNumber(userData.completed),
  };

  const totalsUpdate = {
    totalorders: Math.max(0, currentTotals.totalorders + (delta.totalorders || 0)),
    pending: Math.max(0, currentTotals.pending + (delta.pending || 0)),
    completed: Math.max(0, currentTotals.completed + (delta.completed || 0)),
  };

  const { error: updateError } = await supabase
    .from('users')
    .update(totalsUpdate)
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to update user totals:', updateError);
  }
};

const parseAddressObject = (input) => {
  if (!input) return null;

  if (typeof input === 'object' && !Array.isArray(input)) {
    return input;
  }

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // Ignore parse errors; treat as unstructured string
    }
  }

  return null;
};

const firstNonEmpty = (...candidates) =>
  candidates.find((value) => typeof value === 'string' && value.trim())?.trim() || null;

router.post('/', async (req, res) => {
  try {
    const {
      userId,
      status = 'pending',
      totals = {},
      shippingAddress,
      billingAddress,
      paymentMethod,
      items = [],
      orderNotes,
      customer = {},
      customerName,
      customerEmail,
      customerPhone,
      firstName,
      lastName,
      phone,
      phoneNumber,
    } = req.body;

    if (!userId || !items.length) {
      return res.status(400).json({ error: 'userId and at least one item are required' });
    }

    const normalizedStatus = normalizeStatus(status);

    const shippingAddressObject = parseAddressObject(shippingAddress);
    const billingAddressObject = parseAddressObject(billingAddress);

    const resolvedFirstName = firstNonEmpty(
      customer?.firstName,
      customer?.firstname,
      firstName,
      shippingAddressObject?.first_name,
      billingAddressObject?.first_name,
    );

    const resolvedLastName = firstNonEmpty(
      customer?.lastName,
      customer?.lastname,
      lastName,
      shippingAddressObject?.last_name,
      billingAddressObject?.last_name,
    );

    const combinedName = (() => {
      const parts = [resolvedFirstName, resolvedLastName].filter(Boolean);
      return parts.length ? parts.join(' ') : null;
    })();

    const resolvedCustomerName = firstNonEmpty(
      combinedName,
      customer?.name,
      customerName,
      shippingAddressObject?.name,
      billingAddressObject?.name,
    );

    const resolvedCustomerEmail = firstNonEmpty(
      customer?.email,
      customerEmail,
      shippingAddressObject?.email,
      billingAddressObject?.email,
    );

    const resolvedCustomerPhone = firstNonEmpty(
      customer?.phone,
      customer?.phoneNumber,
      customer?.phone_number,
      customerPhone,
      phone,
      phoneNumber,
      shippingAddressObject?.phone,
      billingAddressObject?.phone,
    );

    const insertPayload = {
      user_id: userId,
      status: normalizedStatus,
      subtotal: totals.subtotal || 0,
      tax: totals.tax || 0,
      shipping: totals.shipping || 0,
      total: totals.total || 0,
      shipping_address: shippingAddress || null,
      billing_address: billingAddress || null,
      payment_method: paymentMethod || null,
      customer_name: resolvedCustomerName,
      customer_email: resolvedCustomerEmail,
      customer_phone: resolvedCustomerPhone,
    };

    if (typeof orderNotes === 'string' && orderNotes.trim()) {
      insertPayload.order_notes = orderNotes.trim();
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(insertPayload)
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map((item) => {
      const rawProductId = item.productId ?? item.id ?? null;
      let resolvedProductId = null;

      if (typeof rawProductId === 'number' && Number.isFinite(rawProductId)) {
        resolvedProductId = rawProductId;
      } else if (typeof rawProductId === 'string') {
        const trimmed = rawProductId.trim();
        const directNumber = Number(trimmed);
        if (Number.isFinite(directNumber)) {
          resolvedProductId = directNumber;
        } else {
          const match = trimmed.match(/(\d+)/);
          if (match) {
            const parsed = Number(match[1]);
            if (Number.isFinite(parsed)) {
              resolvedProductId = parsed;
            }
          }
        }
      }

      return {
        order_id: order.id,
        product_id: resolvedProductId,
        name: item.name || item.title || 'Product',
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        metadata: item.metadata || null,
      };
    });

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    const totalsDelta = {
      totalorders: 1,
      pending: isPendingStatus(normalizedStatus) ? 1 : 0,
      completed: normalizedStatus === 'completed' ? 1 : 0,
    };

    updateUserTotals(userId, totalsDelta).catch((err) =>
      console.error('User total update error:', err),
    );

    // Send order confirmation email (non-blocking)
    if (resolvedCustomerEmail) {
      setImmediate(async () => {
        try {
          // Get user name for email
          let userName = resolvedCustomerName || 'Customer';
          if (userName === 'Guest User') {
            userName = resolvedFirstName || resolvedLastName || 'Customer';
          }

          // Format currency
          const formatCurrency = (value) => {
            const num = Number(value) || 0;
            return `PKR ${num.toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
          };

          // Build order items HTML
          const orderItemsHtml = orderItems.map((item, index) => {
            const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
            return `
              <tr style="border-bottom: 1px solid #6b7280;">
                <td style="padding: 12px; text-align: left; color: #e5e7eb;">${index + 1}</td>
                <td style="padding: 12px; text-align: left; color: #e5e7eb;">${item.name || 'Product'}</td>
                <td style="padding: 12px; text-align: center; color: #e5e7eb;">${item.quantity || 1}</td>
                <td style="padding: 12px; text-align: right; color: #e5e7eb;">${formatCurrency(item.price)}</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: #f9fafb;">${formatCurrency(itemTotal)}</td>
              </tr>
            `;
          }).join('');

          const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@hitechcomputers.com';
          
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #1f2937;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #374151; padding: 40px; border-radius: 8px;">
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <img src="${process.env.WEBSITE_URL || 'https://www.hitekcomputers.com'}/navbar-logo.png" alt="Hi-Tek Computers" style="max-width: 200px; height: auto;" />
                </div>

                <!-- Greeting -->
                <p style="font-size: 16px; color: #f3f4f6; line-height: 1.6; margin-bottom: 20px;">
                  Dear ${userName},
                </p>

                <!-- Confirmation Message -->
                <p style="font-size: 16px; color: #e5e7eb; line-height: 1.6; margin-bottom: 30px;">
                  This is a confirmation email to inform you that we have successfully received your order. We are processing your order and will keep you updated on its status.
                </p>

                <!-- Order Details -->
                <div style="background-color: #4b5563; border: 1px solid #6b7280; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                  <h2 style="font-size: 18px; color: #f9fafb; margin-top: 0; margin-bottom: 20px;">Order Details</h2>
                  
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                      <tr style="background-color: #1f2937;">
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #f9fafb; border-bottom: 2px solid #6b7280;">#</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #f9fafb; border-bottom: 2px solid #6b7280;">Product</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #f9fafb; border-bottom: 2px solid #6b7280;">Quantity</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #f9fafb; border-bottom: 2px solid #6b7280;">Price</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #f9fafb; border-bottom: 2px solid #6b7280;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${orderItemsHtml}
                    </tbody>
                  </table>

                  <div style="border-top: 2px solid #6b7280; padding-top: 15px; margin-top: 15px;">
                    <table style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 12px; text-align: right; color: #d1d5db;">Subtotal:</td>
                        <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #f9fafb;">${formatCurrency(totals.subtotal || 0)}</td>
                      </tr>
                      ${totals.tax ? `
                      <tr>
                        <td style="padding: 8px 12px; text-align: right; color: #d1d5db;">Tax:</td>
                        <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #f9fafb;">${formatCurrency(totals.tax)}</td>
                      </tr>
                      ` : ''}
                      ${totals.shipping ? `
                      <tr>
                        <td style="padding: 8px 12px; text-align: right; color: #d1d5db;">Shipping:</td>
                        <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #f9fafb;">${formatCurrency(totals.shipping)}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 12px; text-align: right; font-size: 18px; font-weight: 700; color: #f9fafb; border-top: 2px solid #6b7280;">Total:</td>
                        <td style="padding: 12px; text-align: right; font-size: 18px; font-weight: 700; color: #00aeef; border-top: 2px solid #6b7280;">${formatCurrency(totals.total || 0)}</td>
                      </tr>
                    </table>
                  </div>

                  <p style="margin-top: 20px; margin-bottom: 0; font-size: 14px; color: #d1d5db;">
                    <strong style="color: #f9fafb;">Order ID:</strong> #${order.id}
                  </p>
                </div>

                <!-- Contact Information -->
                <p style="font-size: 16px; color: #e5e7eb; line-height: 1.6; margin-bottom: 10px;">
                  If you have any queries, please call us at:
                </p>
                <p style="font-size: 16px; color: #00aeef; font-weight: 600; margin-bottom: 30px;">
                  +92 21 32430225
                </p>

                <!-- Closing -->
                <p style="font-size: 16px; color: #e5e7eb; line-height: 1.6; margin-bottom: 10px;">
                  Regards,<br />
                  Team Hi-Tek Computers
                </p>
              </div>
            </body>
            </html>
          `;

          const emailText = `
Dear ${userName},

This is a confirmation email to inform you that we have successfully received your order. We are processing your order and will keep you updated on its status.

ORDER DETAILS
Order ID: #${order.id}

Items:
${orderItems.map((item, index) => `${index + 1}. ${item.name || 'Product'} - Quantity: ${item.quantity || 1} - Price: ${formatCurrency(item.price)}`).join('\n')}

Subtotal: ${formatCurrency(totals.subtotal || 0)}
${totals.tax ? `Tax: ${formatCurrency(totals.tax)}\n` : ''}${totals.shipping ? `Shipping: ${formatCurrency(totals.shipping)}\n` : ''}Total: ${formatCurrency(totals.total || 0)}

If you have any queries, please call us at: +92 21 32430225

Regards,
Team Hi-Tek Computers
          `.trim();

          if (emailTransporter) {
            await Promise.race([
              emailTransporter.sendMail({
                from: fromEmail,
                to: resolvedCustomerEmail,
                subject: `Order Confirmation - Order #${order.id}`,
                html: emailHtml,
                text: emailText,
              }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Email sending timeout')), 5000)
              )
            ]);
            console.log('✅ Order confirmation email sent successfully to:', resolvedCustomerEmail);
          } else {
            console.log('='.repeat(50));
            console.log('📧 ORDER CONFIRMATION EMAIL (Email not configured)');
            console.log('='.repeat(50));
            console.log(`To: ${resolvedCustomerEmail}`);
            console.log(`Subject: Order Confirmation - Order #${order.id}`);
            console.log(`\n${emailText}`);
            console.log('='.repeat(50));
          }
        } catch (emailError) {
          console.error('❌ Failed to send order confirmation email:', emailError);
          // Don't block order creation if email fails
        }
      });
    }

    res.json({ order, items: orderItems });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const enriched = await Promise.all(
      (data || []).map(async (order) => {
        if (!order?.user_id) {
          return {
            ...order,
            customer_name: extractCustomerName(order),
          };
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, first_name, last_name, full_name, name, email')
          .eq('id', order.user_id)
          .single();

        if (userError) {
          console.error('Failed to fetch user for order', order.id, userError.message);
        }

        return {
          ...order,
          customer_name: extractCustomerName(order, userData),
          user: userData || null,
        };
      }),
    );

    res.json(enriched);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: error.message || 'Failed to load orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Fetch order by id error:', error);
    res.status(500).json({ error: error.message || 'Failed to load order' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const normalizedStatus = normalizeStatus(status);

    const { data: existingOrder, error: existingError } = await supabase
      .from('orders')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (existingError) throw existingError;

    const { data, error } = await supabase
      .from('orders')
      .update({ status: normalizedStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (existingOrder?.user_id) {
      const previousStatus = normalizeStatus(existingOrder.status);
      const delta = {
        totalorders: 0,
        pending: (isPendingStatus(normalizeStatus(existingOrder.status)) ? -1 : 0) +
          (isPendingStatus(normalizedStatus) ? 1 : 0),
        completed:
          (normalizeStatus(existingOrder.status) === 'completed' ? -1 : 0) +
          (normalizedStatus === 'completed' ? 1 : 0),
      };

      updateUserTotals(existingOrder.user_id, delta).catch((err) =>
        console.error('User totals update error:', err),
      );
    }

    // Log activity for order status update
    const statusMessages = {
      'pending': 'Order marked as pending',
      'processing': 'Order is being processed',
      'shipped': 'Order has been shipped',
      'delivered': 'Order has been delivered',
      'completed': 'Order marked as fulfilled',
      'cancelled': 'Order was cancelled',
    };

    const actionMessage = statusMessages[normalizedStatus] || `Order status updated to ${normalizedStatus}`;
    
    await logActivity({
      type: normalizedStatus === 'cancelled' ? 'order_cancelled' : normalizedStatus === 'completed' ? 'order_fulfilled' : 'order_updated',
      action: `${actionMessage}: Order #${id}`,
      entityType: 'order',
      entityId: id,
      entityName: `Order #${id}`,
      details: {
        orderId: id,
        previousStatus: existingOrder?.status || 'unknown',
        newStatus: normalizedStatus,
      },
    }, req);

    res.json(data);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: error.message || 'Failed to update order' });
  }
});

module.exports = router;

