const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByUser,
  updateOrder,
  deleteOrder,
  getUserOrder,
  cancelOrderFromUser,
  invoiceDownload,
  getOrderStatus,
  updateOrderStatus,
  getOrderForAdmin,
  invoiceDownloadForAdmin
} = require('../controller/orderController');

//get all orders
router.get('/get-orders', getAllOrders);
router.get('/get-order', getOrderForAdmin)
router.post("/create-order/:userId", createOrder);
router.get("/getorder/:userId", getUserOrder)

//get all order by a user
router.get('/user/:id', getOrderByUser);

//get a order by id
router.get('/:id', getOrderById);

//update a order
router.put('/:id', updateOrder);

//delete a order
router.delete('/delete-order/:userId', deleteOrder)
router.put('/cancel-order-by-user/:userId', cancelOrderFromUser)
router.get('/download-invoice/:userId/:orderId', invoiceDownload)
router.get('/download-invoice/:orderId', invoiceDownloadForAdmin)
router.get('/orderStatus/:orderId', getOrderById);
router.put('/updateOrderStatus/:id', updateOrderStatus);



module.exports = router;
