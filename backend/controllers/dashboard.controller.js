const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary();
  success(res, 200, summary);
});

module.exports = { getSummary };
