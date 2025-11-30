const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const googleDriveRoutes = require('./google-drive');
const googleAnalyticsRoutes = require('./routes/google/analytics');
const googleCalendarRoutes = require('./routes/google/calendar');
const googleGmailRoutes = require('./routes/google/gmail');
const googleMapsRoutes = require('./routes/google/maps');
const googleIndexingRoutes = require('./routes/google/indexing');
const credentialsRoutes = require('./routes/credentials');
const stripeRoutes = require('./routes/stripe');
const emailRoutes = require('./routes/email');
const vnpayRoutes = require('./routes/vnpay');
const n8nRoutes = require('./routes/n8n');

app.use('/api/drive', googleDriveRoutes);
app.use('/api/google/analytics', googleAnalyticsRoutes);
app.use('/api/google/calendar', googleCalendarRoutes);
app.use('/api/google/gmail', googleGmailRoutes);
app.use('/api/google/maps', googleMapsRoutes);
app.use('/api/google/indexing', googleIndexingRoutes);
app.use('/api/credentials', credentialsRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/vnpay', vnpayRoutes);
app.use('/api/n8n', n8nRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export for Vercel serverless
module.exports = app;
