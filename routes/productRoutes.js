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
  getProductRatings,
  generateInvitation,
  updateInvitation,
  editPdfAndUploadToProduct,
  uploadFile,
  updateTextFields,
  getImage,
  updateImageText,
  uploadTemplate,
  getTemplates,
  getAllProductsByCategorySchool
} = require('../controller/productController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' }); // Temporary storage folder


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
router.get('/getschool', getAllProductsByCategorySchool);
router.get('/getcanvas', getAllProductsByCategoryCanvas);
router.get('/getAcrylic', getAllProductsByCategoryAcrylic);
router.get('/getBanks', getAllProductsByCategoryBanks);
router.get('/getBillBooks', getAllProductsByCategoryBillBooks);
router.get('/getCards', getAllProductsByCategoryCards);
router.post('/rate/:userId', submitRating);
router.get('/ratings/:id', getProductRatings);
router.post('/generate', generateInvitation);
//router.put('/update', updateInvitation);
router.post('/upload-template/:id', upload.single('template'), uploadTemplate);
router.post('/upload/:productId', upload.array('logoImage'), uploadFile);

//router.post("/update", updateImageText);
router.get('/image/:id', getImage);
router.get('/get-templates/:productId', getTemplates);















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
