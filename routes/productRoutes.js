const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getShowingProducts,
  getDiscountedProducts,
  getStockOutProducts,
  getProductById,
  getProductBySlug,
  addProduct,
  addAllProducts,
  updateProduct,
  updateStatus,
  deleteProduct,
  getSimilarProducts,
  searchProducts
} = require('../controller/productController');
const multer = require('multer');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Unique filename
  },
});
const upload = multer({ storage });

// Routes
router.post('/add', upload.array('images', 10), addProduct);

//add multiple products
router.post('/all', addAllProducts);

//get a product
router.get('/:id', getProductById);

//get showing products only
router.get('/show', getShowingProducts);

//get discounted products only
router.get('/discount', getDiscountedProducts);

//get all products
router.get('/', getAllProducts);

//get all stock out products
router.get('/stock-out', getStockOutProducts);

//get a product by slug
router.get('/:slug', getProductBySlug);

//update a product
router.put('/update-product/:id', updateProduct);

//update a product status
router.put('/status/:id', updateStatus);

//delete a product
router.delete('/delete-product/:id', deleteProduct);
router.get('/products/similar', getSimilarProducts);
router.get('/search', searchProducts);



module.exports = router;
