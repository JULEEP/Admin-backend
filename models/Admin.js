const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    image: {
      type: String,
    },
    address: {
      type: String,
    },
    country: {
      type: String,
    },
    city: {
      type: String,
    },

    email: {
      type: String,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
      default: bcrypt.hashSync('12345678'),
    },
    role: {
      type: String,
    },
    joiningData: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

module.exports = Admin;
