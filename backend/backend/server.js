const app = require('./app');
const config = require('./config/env');

app.listen(config.port, () => {
  console.log(`RMS server running on http://localhost:${config.port}`);
});
