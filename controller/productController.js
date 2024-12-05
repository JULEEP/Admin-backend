const Product = require('../models/Product');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });  // Save images in an 'uploads' directory


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
  getSimilarProducts
};
