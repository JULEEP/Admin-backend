const express = require('express');
require('dotenv').config();
const app = express();
const cors = require('cors');
const helmet = require('helmet');

const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userOrderRoutes = require('./routes/userOrderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const couponRoutes = require('./routes/couponRoutes');
const staffRoutes = require('./routes/staffRoutes.js')
const { isAuth, isAdmin } = require('./config/auth');
const connectDatabase = require('./db/connectDatabase.js');

connectDatabase();

// We are using this for the express-rate-limit middleware
// See: https://github.com/nfriedly/express-rate-limit
// app.enable('trust proxy');
app.set('trust proxy', 1);
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(400).json({ message: err.message });
});
app.use(express.json());
app.use(helmet());
app.use(cors());

//root route
app.get('/', (req, res) => {
  res.send('App works properly!');
});

//this for route will need for store front, also for admin dashboard
app.use('/api/products/', productRoutes);
app.use('/api/category/', categoryRoutes);
app.use('/api/coupon/', couponRoutes);
app.use('/api/user/', userRoutes);
app.use('/api/order/', userOrderRoutes);

//if you not use admin dashboard then these two route will not needed.
app.use('/api/admin/', adminRoutes);
app.use('/api/orders/', orderRoutes);
app.use('/api/staff/', staffRoutes);


// Use express's default error handling middleware

const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => console.log(`server running on port ${PORT}`));

app.listen(PORT, () => console.log(`server running on port ${PORT}`));
