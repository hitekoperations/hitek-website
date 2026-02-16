const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { logActivity } = require('./activities');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');

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

// Initialize Resend if API key is available
let resendClient = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend email client initialized');
}

// Create email transporter (same logic as auth.js)
const createEmailTransporter = () => {
  const connectionOptions = {
    connectionTimeout: 30000, // 30 seconds for cloud platforms
    greetingTimeout: 30000,
    socketTimeout: 30000,
    secure: true, // Use TLS
    requireTLS: true,
    tls: {
      rejectUnauthorized: false, // Some cloud platforms need this
    },
  };

  // Check for Resend first (best for cloud platforms, no SMTP blocking issues)
  if (process.env.EMAIL_SERVICE === 'resend' || process.env.RESEND_API_KEY) {
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️  Resend email configuration incomplete:');
      console.log('   RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
      return null;
    }
    // Return a special marker object to indicate Resend should be used
    return { useResend: true };
  }

  // Check for Gmail configuration
  if (process.env.EMAIL_SERVICE === 'gmail' || process.env.EMAIL_USER?.includes('@gmail.com')) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️  Gmail email configuration incomplete:');
      console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
      console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
      return null;
    }
    
    console.log('✅ Gmail email transporter configured');
    console.log('   Using Gmail account:', process.env.EMAIL_USER);
    
    // Try Gmail SMTP with explicit host/port (more reliable on cloud platforms)
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Should be Gmail App Password
      },
      ...connectionOptions,
      pool: false, // Disable pooling for better reliability
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

// Log email configuration status
if (emailTransporter?.useResend) {
  console.log('✅ Resend email service configured');
} else if (emailTransporter) {
  console.log('✅ Email transporter initialized successfully');
} else {
  console.log('⚠️  Email transporter not configured - emails will be logged to console');
  console.log('   For Resend: Set EMAIL_SERVICE=resend and RESEND_API_KEY');
  console.log('   For Gmail: Set EMAIL_SERVICE=gmail, EMAIL_USER and EMAIL_PASSWORD (use App Password)');
  console.log('   Current EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'not set');
  console.log('   Current RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'set' : 'not set');
  console.log('   Current EMAIL_USER:', process.env.EMAIL_USER ? 'set' : 'not set');
  console.log('   Current EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'set' : 'not set');
}

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
      voucherCode,
      voucherId,
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
      discount: totals.discount || 0,
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

    // Store voucher information if provided
    if (voucherCode) {
      insertPayload.voucher_code = voucherCode;
    }
    if (voucherId) {
      insertPayload.voucher_id = voucherId;
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

    // Update voucher to mark it as availed with order_id if voucher was used
    if (voucherId && order?.id) {
      try {
        await supabase
          .from('vouchers')
          .update({
            is_availed: true,
            availed_by: userId,
            availed_at: new Date().toISOString(),
            order_id: order.id,
          })
          .eq('id', voucherId);
      } catch (voucherUpdateError) {
        console.error('Failed to update voucher after order creation:', voucherUpdateError);
        // Don't fail the order if voucher update fails
      }
    }

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
          
          // Fetch user password for guest orders (users created recently, likely from guest checkout)
          // Check if user was created within the last 10 minutes (guest checkout creates account just before order)
          let userPassword = null;
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('password, created_at, id')
              .eq('id', userId)
              .single();
            
            if (!userError && userData && userData.password) {
              // Check if user was created recently (within last 10 minutes) - likely a guest checkout
              const userCreatedAt = userData.created_at ? new Date(userData.created_at) : null;
              const now = new Date();
              const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
              
              // If user was created within last 10 minutes, send credentials
              // Also send if created_at is null (older users table might not have this field)
              if (!userCreatedAt || userCreatedAt >= tenMinutesAgo) {
                userPassword = userData.password;
                console.log('📧 Guest order detected - will send login credentials');
                console.log('   User created at:', userCreatedAt || 'unknown');
              } else {
                console.log('📧 Existing user order - credentials not sent');
                console.log('   User created at:', userCreatedAt);
              }
            } else if (userError) {
              console.error('Error fetching user data:', userError);
            }
          } catch (error) {
            console.error('Error fetching user password:', error);
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
                <td class="mobile-hide" style="padding: 12px 8px; text-align: left; color: #e5e7eb; font-size: 14px;">${index + 1}</td>
                <td style="padding: 12px 8px; text-align: left; color: #e5e7eb; font-size: 14px;">${item.name || 'Product'}</td>
                <td style="padding: 12px 8px; text-align: center; color: #e5e7eb; font-size: 14px;">${item.quantity || 1}</td>
                <td class="mobile-hide" style="padding: 12px 8px; text-align: right; color: #e5e7eb; font-size: 14px; white-space: nowrap;">${formatCurrency(item.price)}</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #f9fafb; font-size: 14px; white-space: nowrap;">${formatCurrency(itemTotal)}</td>
              </tr>
            `;
          }).join('');

          const fromEmailAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@hitechcomputers.com';
          const fromEmail = `Order Confirmation - Hi-Tek Computers <${fromEmailAddress}>`;
          
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                @media only screen and (max-width: 600px) {
                  .email-container {
                    padding: 20px !important;
                  }
                  .logo-img {
                    max-width: 150px !important;
                  }
                  .content-text {
                    font-size: 14px !important;
                  }
                  .order-box {
                    padding: 15px !important;
                  }
                  .order-title {
                    font-size: 16px !important;
                  }
                  .main-heading {
                    font-size: 20px !important;
                  }
                  .order-table {
                    font-size: 12px !important;
                  }
                  .order-table th,
                  .order-table td {
                    padding: 8px 4px !important;
                  }
                  .order-table .mobile-hide {
                    display: none !important;
                  }
                  .order-table .mobile-full {
                    display: block !important;
                    width: 100% !important;
                  }
                  .total-amount {
                    font-size: 16px !important;
                  }
                  .contact-phone {
                    font-size: 14px !important;
                  }
                }
              </style>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #1f2937;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1f2937;">
                <tr>
                  <td style="padding: 20px 10px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #374151; border-radius: 8px;">
                      <tr>
                        <td class="email-container" style="padding: 40px;">
                          <!-- Logo -->
                          <div style="text-align: center; margin-bottom: 20px;">
                            <img src="${process.env.WEBSITE_URL || 'https://www.hitekcomputers.com'}/navbar-logo.png" alt="Hi-Tek Computers" class="logo-img" style="max-width: 200px; width: 100%; height: auto;" />
                          </div>

                          <!-- Main Heading -->
                          <h1 class="main-heading" style="font-size: 24px; color: #f9fafb; text-align: center; margin: 0 0 30px 0; font-weight: 700; line-height: 1.3;">
                            Order Confirmation - Hi-Tek
                          </h1>

                          <!-- Greeting -->
                          <p class="content-text" style="font-size: 16px; color: #f3f4f6; line-height: 1.6; margin-bottom: 20px;">
                            Dear ${userName},
                          </p>

                          <!-- Confirmation Message -->
                          <p class="content-text" style="font-size: 16px; color: #e5e7eb; line-height: 1.6; margin-bottom: 30px;">
                            This is a confirmation email to inform you that we have successfully received your order. We are processing your order and will keep you updated on its status.
                          </p>

                          <!-- Order Details -->
                          <div class="order-box" style="background-color: #4b5563; border: 1px solid #6b7280; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                            <h2 class="order-title" style="font-size: 18px; color: #f9fafb; margin-top: 0; margin-bottom: 20px;">Order Details</h2>
                            
                            <!-- Desktop Table -->
                            <table class="order-table" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                              <thead>
                                <tr style="background-color: #1f2937;">
                                  <th class="mobile-hide" style="padding: 12px 8px; text-align: left; font-weight: 600; color: #f9fafb; border-bottom: 2px solid #6b7280; font-size: 14px;">#</th>
                                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #f9fafb; border-bottom: 2px solid #6b7280; font-size: 14px;">Product</th>
                                  <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #f9fafb; border-bottom: 2px solid #6b7280; font-size: 14px;">Qty</th>
                                  <th class="mobile-hide" style="padding: 12px 8px; text-align: right; font-weight: 600; color: #f9fafb; border-bottom: 2px solid #6b7280; font-size: 14px;">Price</th>
                                  <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #f9fafb; border-bottom: 2px solid #6b7280; font-size: 14px;">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${orderItemsHtml}
                              </tbody>
                            </table>

                            <div style="border-top: 2px solid #6b7280; padding-top: 15px; margin-top: 15px;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width: 100%;">
                                <tr>
                                  <td style="padding: 8px 12px; text-align: right; color: #d1d5db; font-size: 14px;">Subtotal:</td>
                                  <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #f9fafb; font-size: 14px; white-space: nowrap;">${formatCurrency(totals.subtotal || 0)}</td>
                                </tr>
                                ${totals.tax ? `
                                <tr>
                                  <td style="padding: 8px 12px; text-align: right; color: #d1d5db; font-size: 14px;">Tax:</td>
                                  <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #f9fafb; font-size: 14px; white-space: nowrap;">${formatCurrency(totals.tax)}</td>
                                </tr>
                                ` : ''}
                                ${totals.shipping ? `
                                <tr>
                                  <td style="padding: 8px 12px; text-align: right; color: #d1d5db; font-size: 14px;">Shipping:</td>
                                  <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #f9fafb; font-size: 14px; white-space: nowrap;">${formatCurrency(totals.shipping)}</td>
                                </tr>
                                ` : ''}
                                <tr>
                                  <td class="total-amount" style="padding: 12px; text-align: right; font-size: 18px; font-weight: 700; color: #f9fafb; border-top: 2px solid #6b7280;">Total:</td>
                                  <td class="total-amount" style="padding: 12px; text-align: right; font-size: 18px; font-weight: 700; color: #00aeef; border-top: 2px solid #6b7280; white-space: nowrap;">${formatCurrency(totals.total || 0)}</td>
                                </tr>
                              </table>
                            </div>

                            <p style="margin-top: 20px; margin-bottom: 0; font-size: 14px; color: #d1d5db;">
                              <strong style="color: #f9fafb;">Order ID:</strong> #${order.id}
                            </p>
                          </div>

                          ${userPassword ? `
                          <!-- Login Credentials for Guest Users -->
                          <div style="background-color: #4b5563; border: 1px solid #6b7280; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                            <h2 style="font-size: 18px; color: #f9fafb; margin-top: 0; margin-bottom: 15px;">Your Account Login</h2>
                            <p class="content-text" style="font-size: 16px; color: #e5e7eb; line-height: 1.6; margin-bottom: 15px;">
                              An account has been created for you. Use the following credentials to log in to our website:
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width: 100%; margin-top: 15px;">
                              <tr>
                                <td style="padding: 10px 0; font-size: 14px; color: #d1d5db; width: 120px;"><strong style="color: #f9fafb;">Email:</strong></td>
                                <td style="padding: 10px 0; font-size: 14px; color: #e5e7eb; word-break: break-all;">${resolvedCustomerEmail}</td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0; font-size: 14px; color: #d1d5db;"><strong style="color: #f9fafb;">Password:</strong></td>
                                <td style="padding: 10px 0; font-size: 14px; color: #e5e7eb; font-family: monospace; word-break: break-all;">${userPassword}</td>
                              </tr>
                            </table>
                            <p class="content-text" style="font-size: 14px; color: #d1d5db; line-height: 1.6; margin-top: 15px; margin-bottom: 0;">
                              You can change your password after logging in from your account settings.
                            </p>
                          </div>
                          ` : ''}

                          <!-- Contact Information -->
                          <p class="content-text" style="font-size: 16px; color: #e5e7eb; line-height: 1.6; margin-bottom: 10px;">
                            If you have any queries, please call us at:
                          </p>
                          <p class="contact-phone" style="font-size: 16px; color: #00aeef; font-weight: 600; margin-bottom: 30px; word-break: break-all;">
                            <a href="tel:+922132430225" style="color: #00aeef; text-decoration: none;">+92 21 32430225</a>
                          </p>

                          <!-- Closing -->
                          <p class="content-text" style="font-size: 16px; color: #e5e7eb; line-height: 1.6; margin-bottom: 10px;">
                            Regards,<br />
                            Team Hi-Tek Computers
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
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

${userPassword ? `
YOUR ACCOUNT LOGIN
An account has been created for you. Use the following credentials to log in to our website:

Email: ${resolvedCustomerEmail}
Password: ${userPassword}

You can change your password after logging in from your account settings.

` : ''}
If you have any queries, please call us at: +92 21 32430225

Regards,
Team Hi-Tek Computers
          `.trim();

          if (emailTransporter) {
            console.log('📧 Attempting to send order confirmation email...');
            console.log('   From:', fromEmail);
            console.log('   To:', resolvedCustomerEmail);
            console.log('   Subject: Order Confirmation - Order #' + order.id);
            
            try {
              // Use Resend if configured (better for cloud platforms)
              if (emailTransporter.useResend && resendClient) {
                console.log('   Using Resend API...');
                const emailResult = await resendClient.emails.send({
                  from: fromEmail,
                  to: resolvedCustomerEmail,
                  subject: `Order Confirmation - Order #${order.id}`,
                  html: emailHtml,
                  text: emailText,
                });
                
                console.log('✅ Order confirmation email sent successfully via Resend!');
                console.log('   Email ID:', emailResult.data?.id);
              } else {
                // Use SMTP (Gmail, SendGrid, etc.)
                // Retry logic for email sending (up to 3 retries)
                let lastError = null;
                for (let attempt = 1; attempt <= 3; attempt++) {
                  try {
                    console.log(`   Attempt ${attempt} of 3...`);
                    const emailResult = await Promise.race([
                      emailTransporter.sendMail({
                        from: fromEmail,
                        to: resolvedCustomerEmail,
                        subject: `Order Confirmation - Order #${order.id}`,
                        html: emailHtml,
                        text: emailText,
                      }),
                      new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Email sending timeout')), 30000)
                      )
                    ]);
                    
                    console.log('✅ Order confirmation email sent successfully!');
                    console.log('   Message ID:', emailResult.messageId);
                    console.log('   Response:', emailResult.response);
                    break; // Success, exit retry loop
                  } catch (attemptError) {
                    lastError = attemptError;
                    console.error(`❌ Attempt ${attempt} failed:`, attemptError.message);
                    console.error('   Error code:', attemptError.code);
                    
                    if (attemptError.code === 'EAUTH') {
                      console.error('   ⚠️  Authentication failed. Make sure:');
                      console.error('      1. EMAIL_USER is your full Gmail address');
                      console.error('      2. EMAIL_PASSWORD is a Gmail App Password (not your regular password)');
                      console.error('      3. 2-Step Verification is enabled on your Gmail account');
                      console.error('      4. App Password is generated from: https://myaccount.google.com/apppasswords');
                      break; // Don't retry auth errors
                    }
                    
                    if (attempt < 3) {
                      const waitTime = attempt * 2000; // 2s, 4s delays
                      console.log(`   Retrying in ${waitTime/1000} seconds...`);
                      await new Promise(resolve => setTimeout(resolve, waitTime));
                    }
                  }
                }
                
                if (lastError && lastError.code !== 'EAUTH') {
                  throw lastError;
                }
              }
            } catch (sendError) {
              console.error('❌ Failed to send order confirmation email:', sendError.message);
              if (sendError.message) {
                console.error('   Error details:', sendError.message);
              }
              if (sendError.code === 'ETIMEDOUT' || sendError.code === 'ECONNREFUSED') {
                console.error('   ⚠️  Connection timeout/refused. This often happens on cloud platforms like Render.');
                console.error('   💡 Solution: Use Resend (set EMAIL_SERVICE=resend and RESEND_API_KEY)');
              }
              // Don't throw - order should still succeed even if email fails
            }
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

