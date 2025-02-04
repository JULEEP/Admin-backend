const mongoose = require('mongoose');

// Declare the Schema of the Mongo model
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      quantity: {
        type: Number,
      },
      sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller', // Adjust 'Seller' based on your schema
      },
      title: {
        type: String,
      },
      images: {
        type: [String],
      },
      price: {
        type: Number,
      },
      customDesign: {
        type: String, // Storing the custom design as a base64 string
        default: null,
      },

    },
  ],
  variationId: { type: String }, // Change variationId to a string
  variationId: {
    type: String, // Keep variationId as a string for reference
  },
  variationDetails: {
    paperName: {
      type: String,
    },
    price: {
      type: Number,
    },
    paperSize: {
      type: String,
    },
  },
  cartTotal: { type: Number },
  subTotal: { type: Number },
});

// Export the model
const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
