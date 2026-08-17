const db = require('../db/pool');
const AppError = require('../utils/appError');

/**
 * Create a new quotation
 */
async function createQuotation(data) {
  const { admin_id, customer_id, template_id, items } = data;

  // Verify customer exists
  const customerRes = await db.query('SELECT id FROM users WHERE id = $1', [customer_id]);
  if (!customerRes.rows.length) {
    throw new AppError('Customer not found', 404);
  }

  // Verify template if provided
  if (template_id) {
    const templateRes = await db.query('SELECT id FROM quotation_templates WHERE id = $1', [template_id]);
    if (!templateRes.rows.length) {
      throw new AppError('Quotation template not found', 404);
    }
  }

  // Store items as JSONB
  const itemsJson = JSON.stringify(items);

  const result = await db.query(
    `INSERT INTO quotations (admin_id, customer_id, template_id, items, status)
     VALUES ($1, $2, $3, $4, 'draft')
     RETURNING id, admin_id, customer_id, template_id, items, status, created_at`,
    [admin_id, customer_id, template_id || null, itemsJson]
  );

  const quotation = result.rows[0];
  return {
    id: quotation.id,
    admin_id: quotation.admin_id,
    customer_id: quotation.customer_id,
    template_id: quotation.template_id,
    items: quotation.items,
    status: quotation.status,
    created_at: quotation.created_at,
  };
}

/**
 * Get all quotations (with optional filters)
 */
async function getAllQuotations(filters = {}) {
  let query = 'SELECT * FROM quotations WHERE 1=1';
  const values = [];
  let paramIndex = 1;

  if (filters.admin_id) {
    query += ` AND admin_id = $${paramIndex}`;
    values.push(filters.admin_id);
    paramIndex++;
  }

  if (filters.customer_id) {
    query += ` AND customer_id = $${paramIndex}`;
    values.push(filters.customer_id);
    paramIndex++;
  }

  if (filters.status) {
    query += ` AND status = $${paramIndex}`;
    values.push(filters.status);
    paramIndex++;
  }

  query += ' ORDER BY created_at DESC';

  const result = await db.query(query, values);
  return result.rows.map((row) => ({
    id: row.id,
    admin_id: row.admin_id,
    customer_id: row.customer_id,
    template_id: row.template_id,
    items: row.items,
    status: row.status,
    created_at: row.created_at,
  }));
}

/**
 * Get a single quotation by ID
 */
async function getQuotationById(id) {
  const result = await db.query(
    'SELECT * FROM quotations WHERE id = $1',
    [id]
  );

  if (!result.rows.length) {
    throw new AppError('Quotation not found', 404);
  }

  const row = result.rows[0];
  return {
    id: row.id,
    admin_id: row.admin_id,
    customer_id: row.customer_id,
    template_id: row.template_id,
    items: row.items,
    status: row.status,
    created_at: row.created_at,
  };
}

/**
 * Update quotation items
 */
async function updateQuotationItems(id, items) {
  // Verify quotation exists
  await getQuotationById(id);

  const itemsJson = JSON.stringify(items);

  const result = await db.query(
    `UPDATE quotations
     SET items = $1
     WHERE id = $2
     RETURNING id, admin_id, customer_id, template_id, items, status, created_at`,
    [itemsJson, id]
  );

  const quotation = result.rows[0];
  return {
    id: quotation.id,
    admin_id: quotation.admin_id,
    customer_id: quotation.customer_id,
    template_id: quotation.template_id,
    items: quotation.items,
    status: quotation.status,
    created_at: quotation.created_at,
  };
}

/**
 * Update quotation status
 */
async function updateQuotationStatus(id, status) {
  // Verify quotation exists
  await getQuotationById(id);

  const result = await db.query(
    `UPDATE quotations
     SET status = $1
     WHERE id = $2
     RETURNING id, admin_id, customer_id, template_id, items, status, created_at`,
    [status, id]
  );

  const quotation = result.rows[0];
  return {
    id: quotation.id,
    admin_id: quotation.admin_id,
    customer_id: quotation.customer_id,
    template_id: quotation.template_id,
    items: quotation.items,
    status: quotation.status,
    created_at: quotation.created_at,
  };
}

/**
 * Confirm a quotation: convert it into an offline order.
 * - Sets quotation status='confirmed'
 * - Creates orders row (order_type='offline', status='pending')
 * - Creates order_items rows from quotation.items
 * - Creates security_deposits row (status='held')
 * Mirrors Step 2.3 checkout.service.checkout() so downstream steps
 * (pickup/return/late-fee/dashboard) work identically for online and offline orders.
 *
 * order_items.start_date/end_date are NOT NULL in the schema, but quotation
 * items (built in Step 3.2) only carry product_id/description/quantity/unit_price
 * — no dates, since offline quotations are drafted before a rental window is fixed.
 * If an item provides start_date/end_date (e.g. added later by an updated admin
 * form) those are used; otherwise this defaults to today -> tomorrow so the
 * NOT NULL constraint is satisfied. Admins can adjust the real dates from the
 * Pickup Schedule (Step 4.1) once the physical handover date is known.
 */
async function confirmQuotation(id) {
  const quotation = await getQuotationById(id);

  if (quotation.status === 'confirmed') {
    throw new AppError('Quotation is already confirmed', 400);
  }

  const items = quotation.items;
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Quotation has no items to confirm', 400);
  }

  if (!quotation.customer_id) {
    throw new AppError('Quotation has no customer assigned; cannot create an order', 400);
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Calculate totals from quotation items (same 30% deposit rule as Step 2.3)
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.unit_price * item.quantity;
    }
    const deposit_amount = Math.ceil(subtotal * 0.3);
    const total = subtotal + deposit_amount;

    // Create order (offline)
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, order_type, status, delivery_mode, address, subtotal, deposit_amount, total, created_at)
       VALUES ($1, 'offline', 'pending', 'store', NULL, $2, $3, $4, now())
       RETURNING id, user_id, order_type, status, delivery_mode, address, subtotal, deposit_amount, total, created_at`,
      [quotation.customer_id, subtotal, deposit_amount, total]
    );
    const order = orderResult.rows[0];

    // Create order_items from quotation.items
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, start_date, end_date, qty, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.id,
          item.product_id,
          item.variant_id || null,
          item.start_date || today,
          item.end_date || tomorrow,
          item.quantity,
          item.unit_price,
        ]
      );
    }

    // Create security_deposits row (status='held')
    await client.query(
      `INSERT INTO security_deposits (order_id, amount, status, refunded_amount)
       VALUES ($1, $2, 'held', 0)`,
      [order.id, deposit_amount]
    );

    // Mark quotation confirmed
    await client.query(
      `UPDATE quotations SET status = 'confirmed' WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');

    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Delete a quotation
 */
async function deleteQuotation(id) {
  // Verify quotation exists
  await getQuotationById(id);

  await db.query('DELETE FROM quotations WHERE id = $1', [id]);
}

module.exports = {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotationItems,
  updateQuotationStatus,
  confirmQuotation,
  deleteQuotation,
};
