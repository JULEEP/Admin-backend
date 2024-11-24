const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    logo: {
      type: String,
    },

    couponCode: {
      type: String,
    },
    endTime: {
      type: Date,
    },
    discountPercentage: {
      type: Number,
    },
    minimumAmount: {
      type: Number,
    },
    productType: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
