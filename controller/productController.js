const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');

// Add Product
const addProduct = async (req, res) => {
  try {
    const newProduct = new Product({
      name: req.body.name || '',
      category: req.body.category || '',
      slug: req.body.slug || '',
      description: req.body.description || '',
      size: req.body.size || '',
      color: req.body.color || '',
      moq: req.body.moq || 0,
      originalPrice: req.body.originalPrice || 0,
      discountedPrice: req.body.discountedPrice || 0,
      type: req.body.type || '',
      quantity: req.body.quantity || 0,
      unit: req.body.unit || '',
      parent: req.body.parent || '',
      children: req.body.children || '',
      images: req.body.images,
    });

    // Handle file uploads
    // if (req.files && req.files.length > 0) {
    //   newProduct.images = req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
    // }

    // Save product to the database
    await newProduct.save();

    res.status(200).json({
      message: 'Product added successfully!',
      newProduct,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const addAllProducts = async (req, res) => {
  try {
    const { body, query } = req;

    // Filter products based on required fields (e.g., name, price, category)
    const filteredProducts = body.filter(product => {
      // Ensure the product has essential fields like name, price, and category
      if (!product.name || !product.price || !product.category) {
        return false;
      }

      // Check if the price is a valid positive number
      if (product.price <= 0) {
        return false;
      }

      return true;
    });

    // If no valid products after filtering, return an error
    if (filteredProducts.length === 0) {
      return res.status(400).send({
        message: 'No valid products to add.',
      });
    }

    // Remove duplicates based on product name (or any unique field)
    const uniqueProducts = [];
    const seenNames = new Set();

    filteredProducts.forEach(product => {
      if (!seenNames.has(product.name)) {
        seenNames.add(product.name);
        uniqueProducts.push(product);
      }
    });

    // Sorting based on 'sortBy' query parameter, if provided
    if (query.sortBy) {
      switch (query.sortBy) {
        case 'recently_added':
          // Sort by the date added (assuming you have a 'createdAt' field in the product schema)
          uniqueProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'price_desc':
          // Sort by price, from higher to lower
          uniqueProducts.sort((a, b) => b.price - a.price);
          break;
        case 'price_asc':
          // Sort by price, from lower to higher
          uniqueProducts.sort((a, b) => a.price - b.price);
          break;
        default:
          // No sorting, keep the original order
          break;
      }
    }

    // Delete all existing products and insert the filtered, unique, and sorted products
    await Product.deleteMany();
    await Product.insertMany(uniqueProducts);

    res.status(200).send({
      message: 'Products added successfully!',
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};


const getShowingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'Show' }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getDiscountedProducts = async (req, res) => {
  try {
    const products = await Product.find({ discount: { $gt: 5 } }).sort({
      _id: -1,
    });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};
const getAllProductsBySearh = async (req, res) => {
  const { name, description, category } = req.query;  // Get query parameters from the request

  try {
    // Build the query object dynamically based on the parameters passed in the URL
    let query = {};

    if (name) {
      query.name = { $regex: name, $options: 'i' };  // Case-insensitive search for name
    }
    if (description) {
      query.description = { $regex: description, $options: 'i' };  // Case-insensitive search for description
    }
    if (category) {
      query.category = { $regex: category, $options: 'i' };  // Case-insensitive search for category
    }

    // Find products matching the query parameters
    const products = await Product.find(query).sort({ _id: -1 });

    // Send the results as a response
    res.send(products);
  } catch (err) {
    // Handle errors
    res.status(500).send({
      message: err.message,
    });
  }
};


const getAllProductsByCategory = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Hordings" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategoryFliers = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Fliers" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategoryCanvas = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Canvas Printing" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategoryAcrylic = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Acrylic Printing" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategoryBanks = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Banks" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategoryBillBooks = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Bill Books" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategoryCards = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Cards" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};


const getStockOutProducts = async (req, res) => {
  try {
    const products = await Product.find({ quantity: { $lt: 1 } }).sort({
      _id: -1,
    });

    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    res.send(product);
  } catch (err) {
    res.status(500).send({
      message: `Slug problem, ${err.message}`,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.send(product);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.sku = req.body.sku;
      product.title = req.body.title;
      product.slug = req.body.slug;
      product.description = req.body.description;
      product.parent = req.body.parent;
      product.children = req.body.children;
      product.type = req.body.type;
      product.unit = req.body.unit;
      product.quantity = req.body.quantity;
      product.originalPrice = req.body.originalPrice;
      product.price = req.body.price;
      product.discount = req.body.discount;
      product.image = req.body.image;
      product.tag = req.body.tag;
      await product.save();
      res.send({ data: product, message: 'Product updated successfully!' });
    }
    // handleProductStock(product);
  } catch (err) {
    res.status(404).send(err.message);
  }
};

const updateStatus = (req, res) => {
  const newStatus = req.body.status;
  Product.updateOne(
    { _id: req.params.id },
    {
      $set: {
        status: newStatus,
      },
    },
    (err) => {
      if (err) {
        res.status(500).send({
          message: err.message,
        });
      } else {
        res.status(200).send({
          message: `Product ${newStatus} Successfully!`,
        });
      }
    }
  );
};

const deleteProduct = (req, res) => {
  Product.deleteOne({ _id: req.params.id }, (err) => {
    if (err) {
      res.status(500).send({
        message: err.message,
      });
    } else {
      res.status(200).send({
        message: 'Product Deleted Successfully!',
      });
    }
  });
};

const getSimilarProducts = async (req, res) => {
  try {
    const { filterBy } = req.query;  // Get the filter type (price or name) from the query string
    const { value } = req.body;  // Get the value to filter by (either price or name)

    // Check if the 'value' and 'filterBy' parameters are provided
    if (!value || !filterBy) {
      return res.status(400).send({ message: "Both 'value' and 'filterBy' are required" });
    }

    let query = {};

    // Define the filter condition based on filterBy parameter
    if (filterBy === 'price') {
      query = { originalPrice: value };  // Find products with the same originalPrice
    } else if (filterBy === 'name') {
      query = { name: { $regex: value, $options: 'i' } };  // Find products with similar name
    } else {
      return res.status(400).send({ message: "Invalid filter. Use 'price' or 'name'" });
    }

    // Find similar products based on the query
    const similarProducts = await Product.find(query).sort({ _id: -1 });

    // If no similar products are found
    if (similarProducts.length === 0) {
      return res.status(404).send({ message: "No similar products found" });
    }

    // Return the list of similar products
    res.status(200).json(similarProducts);

  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Search Controller
const searchProducts = async (req, res) => {
  const { query } = req.query;

  try {
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    // Search Products by name, description, or category (you can modify the fields as needed)
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
      ],
    });

    return res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to store uploaded designs
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique file name
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/; // Allowed file extensions
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
    }
  },
}).single('design'); // Specify the field name (e.g., 'design') in the form for the uploaded file

// Controller to handle design upload
const uploadDesign = async (req, res) => {
  try {
    const productId = req.params.id; // Product ID from the route

    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded!' });
      }

      // Get the uploaded file path
      const designPath = `/uploads/${req.file.filename}`;

      // Find the product and update the myDesigns array
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found!' });
      }

      // Add the new design path to the myDesigns array
      product.myDesigns.push(designPath);

      await product.save();

      res.status(200).json({
        message: 'Design uploaded successfully!',
        product,
      });
    });
  } catch (error) {
    console.error('Error uploading design:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const submitRating = async (req, res) => {
  const { productId, rating, comment } = req.body;
  const { userId } = req.params; // Get userId from the URL params

  // Check if the rating is valid
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating should be between 1 and 5" });
  }

  try {
    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user has already rated this product
    const existingRating = product.ratings.find(rating => rating.userId.toString() === userId);
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this product' });
    }

    // Add the new rating to the product
    product.ratings.push({ userId, rating, comment });

    // Recalculate the average rating
    product.averageRating = product.calculateAverageRating();
    product.reviewCount = product.ratings.length; // Update review count

    // Save the product with the new rating
    await product.save();

    return res.status(201).json({
      message: 'Rating submitted successfully!',
      product: product,
      rating: { userId, rating, comment },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Get Ratings for a Product
const getProductRatings = async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId).populate('ratings');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ ratings: product.ratings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
  addProduct,
  addAllProducts,
  getAllProducts,
  getShowingProducts,
  getDiscountedProducts,
  getStockOutProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  updateStatus,
  deleteProduct,
  getSimilarProducts,
  searchProducts,
  getAllProductsByCategory,
  getAllProductsByCategoryFliers,
  getAllProductsByCategoryCanvas,
  getAllProductsByCategoryAcrylic,
  getAllProductsByCategoryBanks,
  getAllProductsByCategoryBillBooks,
  getAllProductsByCategoryCards,
  uploadDesign,
  getAllProductsBySearh,
  submitRating,
  getProductRatings
};