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
    size: { type: String, default: '' },
    color: { type: String, default: '' },
    moq: { type: Number, default: 0 },  // Minimum Order Quantity (MOQ)
    discountedPrice: { type: Number, default: 0 },  // Discounted price of the product
    children: { type: String, default: '' },  // Child categories or other relation (optional)
    parent: { type: String, default: '' },  // Parent category or relation (optional)
    unit: { type: String, default: '' }, // Unit of measurement (optional)
    images: [{ type: String }],  // Assuming the images will be file paths or URLs (optional)
    myDesigns: [{ type: String }], // Array of designs using the sub-schema
    ratings: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: false },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    generateCard: [
      {
        fileName: { type: String },
        filePath: { type: String },
        eventName: { type: String },
        date: { type: String },
        location: { type: String },
        host: { type: String },
        extractedText: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    templateUrl: { type: String }, // The URL of the template

    // Paper Sizes, Names, Quantities, and Colors - Arrays
    paperSizes: [{ type: String }],
    paperNames: [{ type: String }],
    colors: [{ type: String }],

    // Calculated Product Variations with dynamic prices
    variations: [
      {
        paperSize: { type: String },
        paperName: { type: String },
        color: { type: String },
        quantity: { type: Number },
        price: { type: Number }, // Dynamic price
      }
    ],

    templatesImages: [
      {
        imageUrl: { type: String },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    variations: [
      {
        paperSize: {
          type: String,
        },
        paperName: {
          type: String,
        },
        color: {
          type: String,
        },
        quantity: {
          type: Number,
        },
        price: {
          type: Number,
        },
      },
    ],
    paperSizes: {
      type: [String], // Array of strings for paper sizes
    },
    paperNames: {
      type: [String], // Array of strings for paper names
    },
    colors: {
      type: [String], // Array of strings for colors
    },
    quantities: {
      type: [Number], // Array of numbers for quantities
    },
    templates: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        isTemplate: { type: Boolean, default: false },
      },
    ], // Array to store template details

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
