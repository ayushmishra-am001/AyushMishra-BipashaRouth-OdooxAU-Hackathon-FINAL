function success(res, statusCode, data, message = 'OK') {
  return res.status(statusCode).json({ success: true, data, message });
}

module.exports = { success };
