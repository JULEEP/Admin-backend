const express = require('express');
require('dotenv').config();
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userOrderRoutes = require('./routes/userOrderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const couponRoutes = require('./routes/couponRoutes');
const staffRoutes = require('./routes/staffRoutes');
const { isAuth, isAdmin } = require('./config/auth');
const connectDatabase = require('./db/connectDatabase.js');

// Connect to the database
connectDatabase();

// Increase the limit to 50MB for JSON and URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware
app.use(helmet());
// List of allowed origins
const allowedOrigins = [
  'http://localhost:3000',          // Local development
  'https://e-custome.vercel.app',   // Production site
  'https://admin-two-orpin.vercel.app' // New origin to allow
];

// CORS middleware configuration
app.use(cors({
  origin: function(origin, callback) {
    // If no origin (for non-browser requests) or the origin is in the allowedOrigins array, allow the request
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS')); // Block requests from disallowed origins
    }
  },
  methods: 'GET,POST,PUT,DELETE',  // Allow specific methods, adjust as needed
  allowedHeaders: 'Content-Type,Authorization', // Specify allowed headers if needed
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'uploads')));


// Serve static uploads folder with CORS headers
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
    },
  })
);

// Root route
app.get('/', (req, res) => {
  res.send('App works properly!');
});

// Routes
app.use('/api/products/', productRoutes);
app.use('/api/category/', categoryRoutes);
app.use('/api/coupon/', couponRoutes);
app.use('/api/users/', userRoutes);
app.use('/api/order/', userOrderRoutes);
app.use('/api/admin/', adminRoutes);
app.use('/api/orders/', orderRoutes);
app.use('/api/staff/', staffRoutes);

// Error handler
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(400).json({ message: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));
