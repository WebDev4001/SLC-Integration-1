// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Ensure environment variables are set
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is missing in .env');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing in .env');
  process.exit(1);
}
// TODO: For more complex projects, consider a more comprehensive .env validation:
// - A dedicated function to check all required env variables.
// - Using a library like 'envalid' (if npm install was available) to enforce types and rules.

// Import route modules
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const engageRoutes = require('./routes/engage');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
// TODO: npm install helmet
// const helmet = require('helmet');
// app.use(helmet()); // Helps secure Express apps by setting various HTTP headers.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting for Auth
// TODO: Implement and configure rate limiting for auth routes (e.g., using express-rate-limit).
// The following is an example of how it was previously implemented:
// const rateLimit = require('express-rate-limit'); // Ensure this require is present if uncommenting
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs (adjust as needed)
//   message: 'Too many requests from this IP, please try again after 15 minutes'
//   // standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   // legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });
// app.use('/api/auth', authLimiter); // Apply to all /api/auth routes

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

// API Test Route
app.get('/api', (req, res) => {
  res.json({ message: "Welcome to the API" });
});

// Health Check Route
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/engage', engageRoutes);

// Backend Status Route
app.get('/', (req, res) => {
  res.json({ message: '✅ Backend is running fine!' });
});

// Serve Static Frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Catch-All SPA Route
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: '❌ Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '❌ Internal Server Error', error: err.message });
});


// Log all registered routes
console.log('📝 Registered routes:');
app._router.stack.forEach((middleware) => {
  if (middleware.route) { // Routes directly on app
    console.log(`  ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') { // Router middleware
    // Routers mounted with app.use('/path', router) will have middleware.regexp
    // This regexp can give us the base path.
    const basePath = middleware.regexp.source.replace("^\\/?(?=\\/|$)", "").replace("\\/?$", "").replace(/\\\//g, '/');

    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        const fullPath = (basePath + handler.route.path).replace(/\/$/, ''); // Avoid trailing slash if path is '/'
        console.log(`  ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${fullPath || '/'}`);
      }
    });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS Origin: ${corsOptions.origin}`);
  console.log('🔐 JWT_SECRET and ✅ MONGO_URI are loaded');
});
