const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
    },
    title: {
      type: String,
    },
    slug: {
      type: String,
    },
    unit: {
      type: String,
    },
    parent: {
      type: String,
    },
    children: {
      type: String,
    },
    image: {
      type: String,
    },
    originalPrice: {
      type: Number,
    },
    price: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
    },

    description: {
      type: String,
    },
    type: {
      type: String,
    },
    tag: [String],

    flashSale: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      default: 'Show',
      enum: ['Show', 'Hide'],
    },
    name: { type: String, default: '' },
    category: { type: String, default: '' },
    slug: { type: String, default: '' },
    description: { type: String, default: '' },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
    moq: { type: Number, default: 0 },  // Minimum Order Quantity (MOQ)
    originalPrice: { type: Number, default: 0 },  // Original price of the product
    discountedPrice: { type: Number, default: 0 },  // Discounted price of the product
    type: { type: String, default: '' }, // Assuming a type field (optional)
    quantity: { type: Number, default: 0 },  // Quantity available (optional)
    children: { type: String, default: '' },  // Child categories or other relation (optional)
    parent: { type: String, default: '' },  // Parent category or relation (optional)
    unit: { type: String, default: '' }, // Unit of measurement (optional)
    images: [{ type: String }]  // Assuming the images will be file paths or URLs (optional)
  },

  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
