const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    invoice: {
      type: Number,
    },
    cart: [{}],
    name: {
      type: String,
    },
    address: {
      type: String,
    },
    email: {
      type: String,
    },
    contact: {
      type: String,
    },

    city: {
      type: String,
    },
    country: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    subTotal: {
      type: Number,
    },
    shippingCost: {
      type: Number,
    },
    discount: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
    },
    shippingOption: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
    cardInfo: {
      type: Object,
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Delivered'],
    },
  },
  {
    timestamps: true,
  }
);

const Order =
  mongoose.models.Order ||
  mongoose.model(
    'Order',
    orderSchema.plugin(AutoIncrement, {
      inc_field: 'invoice',
      start_seq: 10000,
    })
  );
module.exports = Order;
