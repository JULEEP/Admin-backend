const express = require('express');
const router = express.Router();
const {
  addCategory,
  addAllCategory,
  getAllCategory,
  getShowingCategory,
  getCategoryById,
  updateCategory,
  updateStatus,
  deleteCategory,
} = require('../controller/categoryController');

//add a category
router.post('/add', addCategory);

//add all category
router.post('/all', addAllCategory);

//get only showing category
router.get('/show', getShowingCategory);

//get all category
router.get('/', getAllCategory);

//get a category
router.get('/:id', getCategoryById);

//update a categorysssssss
router.put('/:id', updateCategory);

//show/hide a category
router.put('/status/:id', updateStatus);

//delete a category
router.delete('/:id', deleteCategory);

module.exports = router;
