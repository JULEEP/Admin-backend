const express = require('express');
const router = express.Router();
const path = require('path'); // Import the 'path' module to work with file paths

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
} = require('../controller/productController');
const multer = require('multer');


// Configure Multer for file uploads
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
});

// Route to handle design upload
router.post('/upload-design/:id', upload.single('design'), uploadDesign);

// Routes
router.post('/add', upload.array('images', 10), addProduct);

//add multiple products
router.post('/all', addAllProducts);
router.get('/getall', getAllProducts);
router.get('/getall-search', getAllProductsBySearh);
router.get('/getallproductbycat', getAllProductsByCategory);
router.get('/getfliers', getAllProductsByCategoryFliers);
router.get('/getcanvas', getAllProductsByCategoryCanvas);
router.get('/getAcrylic', getAllProductsByCategoryAcrylic);
router.get('/getBanks', getAllProductsByCategoryBanks);
router.get('/getBillBooks', getAllProductsByCategoryBillBooks);
router.get('/getCards', getAllProductsByCategoryCards);
router.post('/rate/:userId', submitRating);
router.get('ratings/:productId', getProductRatings);










//get a product
router.get('/singleproduct/:id', getProductById);

//get showing products only
router.get('/show', getShowingProducts);

//get discounted products only
router.get('/discount', getDiscountedProducts);

//get all products

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
