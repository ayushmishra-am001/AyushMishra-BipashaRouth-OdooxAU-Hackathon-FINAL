const db = require('../db/pool');
const AppError = require('../utils/appError');

/**
 * Create a new quotation template
 */
async function createTemplate(data) {
  const { name, header_text, footer_text } = data;

  const result = await db.query(
    `INSERT INTO quotation_templates (name, header_text, footer_text)
     VALUES ($1, $2, $3)
     RETURNING id, name, header_text, footer_text`,
    [name, header_text || null, footer_text || null]
  );

  return result.rows[0];
}

/**
 * Get all quotation templates
 */
async function getAllTemplates() {
  const result = await db.query(
    'SELECT id, name, header_text, footer_text FROM quotation_templates ORDER BY name'
  );
  return result.rows;
}

/**
 * Get a single quotation template by ID
 */
async function getTemplateById(id) {
  const result = await db.query(
    'SELECT id, name, header_text, footer_text FROM quotation_templates WHERE id = $1',
    [id]
  );

  if (!result.rows.length) {
    throw new AppError('Quotation template not found', 404);
  }

  return result.rows[0];
}

/**
 * Update a quotation template
 */
async function updateTemplate(id, data) {
  const { name, header_text, footer_text } = data;

  // Check if template exists
  await getTemplateById(id);

  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
  }

  if (header_text !== undefined) {
    updates.push(`header_text = $${paramIndex++}`);
    values.push(header_text || null);
  }

  if (footer_text !== undefined) {
    updates.push(`footer_text = $${paramIndex++}`);
    values.push(footer_text || null);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(id);
  const query = `
    UPDATE quotation_templates
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, name, header_text, footer_text
  `;

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Delete a quotation template
 */
async function deleteTemplate(id) {
  // Check if template exists
  await getTemplateById(id);

  // Check if template is in use
  const inUseResult = await db.query(
    'SELECT COUNT(*) as count FROM quotations WHERE template_id = $1',
    [id]
  );

  if (parseInt(inUseResult.rows[0].count, 10) > 0) {
    throw new AppError('Cannot delete template that is in use by quotations', 400);
  }

  await db.query('DELETE FROM quotation_templates WHERE id = $1', [id]);
}

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
};
