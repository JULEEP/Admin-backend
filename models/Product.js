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
    filePath: String,
    logoText: String,
    nameText: String,
    addressText: String,
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
    images: [{ type: String }],  // Assuming the images will be file paths or URLs (optional)
    myDesigns: [{type: String}], // Array of designs using the sub-schema
 ratings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      rating: { type: Number, required: true },
      comment: { type: String, required: false },
      createdAt: { type: Date, default: Date.now }, // If you are manually setting, this might override the default behavior

    }
  ],
  generateCard: [
    {
      fileName: { type: String }, // `required` removed
      filePath: { type: String }, // `required` removed
      eventName: { type: String }, // `required` removed
      date: { type: String },     // `required` removed
      location: { type: String }, // `required` removed
      host: { type: String },     // `required` removed
      extractedText: { type: String }, // Added this field to store extracted text
      createdAt: { type: Date, default: Date.now }
    }
  ],
  name: { type: String, default: '' },
  category: { type: String, default: '' },
  slug: { type: String, default: '' },
  description: { type: String, default: '' },
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  moq: { type: Number, default: 0 },
  originalPrice: { type: Number, default: 0 },
  discountedPrice: { type: Number, default: 0 },
  type: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  subcategory: { type: String, default: '' }, // New subcategory field
  images: { type: [String], default: [] }, // To store Cloudinary image URLs
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },

  },

  {
    timestamps: true,
  }
);

// Method to calculate the average rating
productSchema.methods.calculateAverageRating = function () {
  const totalRatings = this.ratings.length;
  if (totalRatings === 0) return 0;

  const sumOfRatings = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
  return sumOfRatings / totalRatings;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
