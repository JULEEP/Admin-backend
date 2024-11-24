const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  contactNumber: {
    type: String,
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  staffRole: {
    type: String,
    enum: ['Admin', 'Manager', 'Designer'],
  },
}, { timestamps: true });

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
