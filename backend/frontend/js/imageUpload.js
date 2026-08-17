const fs = require('fs');
const path = require('path');
const AppError = require('./appError');

const IMAGE_DATA_URI_RE = /^data:image\/(png|jpe?g);base64,(.+)$/;
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

function parseImageDataUri(dataUri) {
  const match = dataUri.match(IMAGE_DATA_URI_RE);
  if (!match) throw new AppError('Image must be a base64 PNG or JPEG data URI', 400);
  return { ext: match[1], data: match[2] };
}

// Decodes a base64 image data URI to disk and returns the public /uploads path.
// `prefix` namespaces the filename (e.g. 'user_12', 'product_7') to avoid collisions.
function saveImage(prefix, imageDataUri) {
  const { ext, data } = parseImageDataUri(imageDataUri);
  const filename = `${prefix}_${Date.now()}.${ext}`;

  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), data, 'base64');

  return `/uploads/${filename}`;
}

module.exports = { parseImageDataUri, saveImage };
