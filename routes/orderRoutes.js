const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByUser,
  updateOrder,
  deleteOrder,
  getUserOrder
} = require('../controller/orderController');

//get all orders
router.get('/get-orders', getAllOrders);
router.post("/create-order/:userId", createOrder);
router.get("/getorder/:userId", getUserOrder)

//get all order by a user
router.get('/user/:id', getOrderByUser);

//get a order by id
router.get('/:id', getOrderById);

//update a order
router.put('/:id', updateOrder);

//delete a order
router.delete('/:id', deleteOrder);

module.exports = router;
