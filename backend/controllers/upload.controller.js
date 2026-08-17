const { saveImage } = require('../utils/imageUpload');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

// POST /api/v1/uploads/image
// Body: { image_base64: 'data:image/png;base64,...' }
// Admin-only (see routes) — used by the admin product form to upload a
// product photo instead of requiring an external hotlink-friendly URL.
const uploadImage = asyncHandler(async (req, res) => {
  const { image_base64: imageBase64 } = req.body;
  if (!imageBase64) throw new AppError('image_base64 is required', 400);

  const url = saveImage('product', imageBase64);
  success(res, 201, { url }, 'Image uploaded');
});

module.exports = { uploadImage };
