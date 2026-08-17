const pool = require('../db/pool');
const AppError = require('../utils/appError');

/**
 * Generate invoice for an order
 * - Verify order exists, belongs to user (owner-only)
 * - Require order.status = 'paid'
 * - Fetch order_items
 * - Generate HTML invoice
 * - Create invoices row (type='rental')
 * - Return HTML (browser can print/save as PDF)
 */
async function generateInvoice(userId, orderId) {
  // Get order and verify ownership + payment status
  const { rows: orderRows } = await pool.query(
    `SELECT id, user_id, order_type, status, delivery_mode, address, subtotal, deposit_amount, total, created_at
     FROM orders
     WHERE id = $1 AND user_id = $2`,
    [orderId, userId]
  );

  if (!orderRows[0]) {
    throw new AppError('Order not found', 404);
  }

  const order = orderRows[0];

  // Require order to be paid
  if (order.status !== 'paid') {
    throw new AppError('Invoice can only be generated for paid orders', 400);
  }

  // Get order items (with product details)
  const { rows: orderItems } = await pool.query(
    `SELECT oi.id, oi.product_id, oi.variant_id, oi.start_date, oi.end_date, oi.qty, oi.price,
            p.name as product_name, p.sku
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = $1
     ORDER BY oi.id ASC`,
    [orderId]
  );

  // Get user details for invoice
  const { rows: userRows } = await pool.query(
    `SELECT id, name, email, phone, address FROM users WHERE id = $1`,
    [userId]
  );

  const user = userRows[0];

  // Create invoices row (type='rental', amount=subtotal, pdf_path=null for HTML)
  const { rows: invoiceRows } = await pool.query(
    `INSERT INTO invoices (order_id, type, amount, pdf_path, created_at)
     VALUES ($1, 'rental', $2, NULL, now())
     RETURNING id, order_id, type, amount, pdf_path, created_at`,
    [orderId, order.subtotal]
  );

  const invoice = invoiceRows[0];

  // Generate HTML invoice
  const htmlInvoice = generateHtmlInvoice({
    order,
    orderItems,
    user,
    invoiceId: invoice.id,
  });

  return {
    invoiceId: invoice.id,
    orderId: order.id,
    html: htmlInvoice,
    amount: order.subtotal,
    createdAt: invoice.created_at,
  };
}

/**
 * Generate HTML invoice string (print-to-PDF friendly)
 */
function generateHtmlInvoice({ order, orderItems, user, invoiceId }) {
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formatPrice = (paise) => `₹${(paise / 100).toFixed(2)}`;

  const itemsHtml = orderItems
    .map(
      (item) => `
    <tr>
      <td>${item.product_name}</td>
      <td>${item.sku || '-'}</td>
      <td>${item.qty}</td>
      <td>${item.start_date} to ${item.end_date}</td>
      <td style="text-align: right;">${formatPrice(item.price)}</td>
      <td style="text-align: right;">${formatPrice(item.price * item.qty)}</td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice #${invoiceId}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 30px;
      border-bottom: 2px solid #007bff;
      padding-bottom: 20px;
    }
    .company-info h1 {
      margin: 0;
      color: #007bff;
      font-size: 28px;
    }
    .invoice-details {
      text-align: right;
    }
    .invoice-details p {
      margin: 5px 0;
      font-weight: 500;
    }
    .invoice-number {
      font-size: 18px;
      color: #007bff;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      color: #555;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }
    .two-column {
      display: flex;
      gap: 40px;
      margin-bottom: 30px;
    }
    .two-column > div {
      flex: 1;
    }
    .info-row {
      margin-bottom: 8px;
    }
    .info-label {
      font-weight: 600;
      color: #666;
      font-size: 12px;
    }
    .info-value {
      margin-top: 2px;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead {
      background-color: #f8f9fa;
      border-bottom: 2px solid #007bff;
    }
    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      color: #333;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }
    tbody tr:hover {
      background-color: #f9f9f9;
    }
    .totals {
      width: 100%;
      margin-top: 20px;
    }
    .totals-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
      gap: 40px;
    }
    .totals-label {
      font-weight: 500;
      min-width: 150px;
      text-align: right;
    }
    .totals-value {
      min-width: 120px;
      text-align: right;
      font-weight: 500;
    }
    .totals-row.total {
      font-size: 16px;
      font-weight: 700;
      color: #007bff;
      padding: 12px 0;
      border-top: 2px solid #007bff;
      border-bottom: 2px solid #007bff;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #888;
      text-align: center;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 100%;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>RENTAL MANAGEMENT SYSTEM</h1>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">Equipment Rental Services</p>
      </div>
      <div class="invoice-details">
        <p class="invoice-number">Invoice #${invoiceId}</p>
        <p>Order #${order.id}</p>
        <p style="font-size: 13px; color: #666; margin-top: 5px;">Date: ${formatDate(order.created_at)}</p>
      </div>
    </div>

    <!-- Customer & Order Info -->
    <div class="two-column">
      <div>
        <div class="section-title">Bill To</div>
        <div class="info-row">
          <div class="info-label">Name</div>
          <div class="info-value">${user.name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email</div>
          <div class="info-value">${user.email}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Phone</div>
          <div class="info-value">${user.phone || '-'}</div>
        </div>
      </div>
      <div>
        <div class="section-title">Order Details</div>
        <div class="info-row">
          <div class="info-label">Order Type</div>
          <div class="info-value">${order.order_type}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Delivery Mode</div>
          <div class="info-value">${order.delivery_mode === 'ship' ? 'Shipping' : 'Store Pickup'}</div>
        </div>
        ${order.address ? `
        <div class="info-row">
          <div class="info-label">Delivery Address</div>
          <div class="info-value">${order.address}</div>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <div class="section">
      <div class="section-title">Items</div>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Qty</th>
            <th>Rental Period</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-row">
        <div class="totals-label">Subtotal:</div>
        <div class="totals-value">${formatPrice(order.subtotal)}</div>
      </div>
      <div class="totals-row">
        <div class="totals-label">Security Deposit (30%):</div>
        <div class="totals-value">${formatPrice(order.deposit_amount)}</div>
      </div>
      <div class="totals-row total">
        <div class="totals-label">TOTAL AMOUNT DUE:</div>
        <div class="totals-value">${formatPrice(order.total)}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This is a computer-generated invoice. Thank you for your business!</p>
      <p>For inquiries, please contact support@rms.local</p>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { generateInvoice };
