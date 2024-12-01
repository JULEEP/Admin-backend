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

// Middleware
app.use(helmet());
const allowedOrigins = ['http://localhost:3000', 'https://e-custome.vercel.app']; // Add all allowed origins here
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

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
