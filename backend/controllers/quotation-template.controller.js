const quotationTemplateService = require('../services/quotation-template.service');
const { validateQuotationTemplate } = require('../validators/quotation.validators');

/**
 * POST /api/v1/quotation-templates
 * Create a new quotation template (admin-only)
 */
async function createTemplateHandler(req, res, next) {
  try {
    const { name, header_text, footer_text } = req.body;

    validateQuotationTemplate({ name, header_text, footer_text });

    const template = await quotationTemplateService.createTemplate({
      name,
      header_text,
      footer_text,
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Quotation template created successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/quotation-templates
 * Get all quotation templates (admin-only)
 */
async function getTemplatesHandler(req, res, next) {
  try {
    const templates = await quotationTemplateService.getAllTemplates();

    res.json({
      success: true,
      data: templates,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/quotation-templates/:id
 * Get a single quotation template (admin-only)
 */
async function getTemplateHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    const template = await quotationTemplateService.getTemplateById(id);

    res.json({
      success: true,
      data: template,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/quotation-templates/:id
 * Update a quotation template (admin-only)
 */
async function updateTemplateHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, header_text, footer_text } = req.body;

    // Only validate provided fields
    if (name !== undefined || header_text !== undefined || footer_text !== undefined) {
      validateQuotationTemplate({ name, header_text, footer_text });
    }

    const template = await quotationTemplateService.updateTemplate(id, {
      name,
      header_text,
      footer_text,
    });

    res.json({
      success: true,
      data: template,
      message: 'Quotation template updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/quotation-templates/:id
 * Delete a quotation template (admin-only)
 */
async function deleteTemplateHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    await quotationTemplateService.deleteTemplate(id);

    res.json({
      success: true,
      message: 'Quotation template deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTemplateHandler,
  getTemplatesHandler,
  getTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
};
