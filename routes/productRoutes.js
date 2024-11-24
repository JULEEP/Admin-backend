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
} = require('../controller/productController');
const multer = require('multer');

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder where you want to save the images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });


//add a product
router.post('/add', upload.array('images', 10),  addProduct);

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

module.exports = router;
