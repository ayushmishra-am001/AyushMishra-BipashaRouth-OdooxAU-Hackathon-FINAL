const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const variantRoutes = require('./routes/variant.routes');
const pricelistRoutes = require('./routes/pricelist.routes');
const pricelistItemRoutes = require('./routes/pricelist-item.routes');
const rentalPeriodRoutes = require('./routes/rental-period.routes');
const cartRoutes = require('./routes/cart.routes');
const ordersRoutes = require('./routes/orders.routes');
const quotationTemplateRoutes = require('./routes/quotation-template.routes');
const quotationRoutes = require('./routes/quotation.routes');
const pickupScheduleRoutes = require('./routes/pickup-schedule.routes');
const returnRoutes = require('./routes/return.routes');
const lateFeeRuleRoutes = require('./routes/late-fee-rule.routes');
const depositRoutes = require('./routes/deposit.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const uploadRoutes = require('./routes/upload.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' })); // raised limit — profile images arrive as base64 JSON

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, data: null, message: 'RMS API running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/products/:productId/variants', variantRoutes);
app.use('/api/v1/pricelists', pricelistRoutes);
app.use('/api/v1/pricelists/:pricelistId/items', pricelistItemRoutes);
app.use('/api/v1/rental-periods', rentalPeriodRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/quotation-templates', quotationTemplateRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/pickup-schedules', pickupScheduleRoutes);
app.use('/api/v1/returns', returnRoutes);
app.use('/api/v1/late-fee-rules', lateFeeRuleRoutes);
app.use('/api/v1/deposits', depositRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/uploads', uploadRoutes);

app.use(notFoundHandler);
app.use(errorHandler); // must be last

module.exports = app;
