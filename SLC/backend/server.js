const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
// Assuming server.js is in backend/ and .env is also in backend/
// If running from project root (e.g. node backend/server.js), this path is correct.
dotenv.config(); // Loads from backend/.env by default if CWD is backend/
                 // If server is started from root as 'node backend/server.js',
                 // then .env in root would be loaded.
                 // To be specific for backend/.env when running from root:
dotenv.config({ path: './backend/.env' });
// Given the subtask runs within the 'backend' context usually, dotenv.config() might be sufficient.
// Let's assume for now the execution context makes `backend/.env` the default.
// A more robust way if server can be started from different locations:
// const path = require('path');
// dotenv.config({ path: path.resolve(__dirname, '.env') });

// For this subtask, let's use a path that's robust assuming server.js is in backend/
// and .env is also in backend/. The __dirname will point to backend/
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });


// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
// Placeholder for other routes mentioned in issue if they were to be integrated
// const chatbotRoutes = require('./routes/chatbot');

const app = express();

// Middleware
// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001', // Default if not in .env
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    console.error('FATAL ERROR: MONGO_URI is not defined in .env file');
    process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });


// API Routes
app.get('/api', (req, res) => { // Simple test route for base API
    res.json({ message: "Welcome to the API" });
});
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/chatbot', chatbotRoutes); // Example if chatbot routes were defined

// i am adding a new set of code just for testing backend
app.get('/', (req, res) => {
    res.json({ message: 'Backend is running fine!' });
});
// 71,72,73 aare the extra code i added for testing backend

// Basic 404 handler for routes not found
app.use((req, res, next) => {
    res.status(404).json({ message: 'Resource not found on this server.' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS enabled for origin: ${corsOptions.origin}`);
    if (!process.env.JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET is not defined in .env');
} else {
    console.log('✅ JWT_SECRET is loaded');
}

if (!process.env.MONGO_URI) {
    console.warn('⚠️ MONGO_URI is not defined in .env');
} else {
    console.log('✅ MONGO_URI is loaded');
}

});
