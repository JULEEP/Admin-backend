const Order = require('../models/Order');
const User = require('../models/User')
const Product = require('../models/Product')
const Cart = require('../models/Cart')
const ShippingAddress = require('../models/ShippingAddress')


const createOrder = (async (req, res, next) => {
  const { userId } = req.params;
  const { paymentMethod, shippingAddress, productId } = req.body;

  try {
      // Fetch the user document
      const user = await User.findById(userId);
      if (!user) {
          return res.status(400).json({ status: false, message: "Invalid user ID" });
      }

      // Retrieve the user's cart from the database
      const userCart = await Cart.findOne({ userId }).populate({
          path: 'products.product',
          select: 'name originalPrice images sellerId categoryName',
      });

      if (!userCart || userCart.products.length === 0) {
          return res.status(400).json({ status: false, message: "User cart is empty or does not exist." });
      }

      const orderedProducts = [];
      let cartTotal = 0;

      // Process the products (if a productId is provided, process it, else use the cart products)
      if (productId) {
          const product = await Product.findById(productId);
          if (!product) {
              return res.status(400).json({ status: false, message: "Product not found" });
          }
          orderedProducts.push({
              product: product._id,
              quantity: 1,
              name: product.name,
              images: product.images || [],
              originalPrice: product.originalPrice,
              category: product.categoryName
          });
          cartTotal += product.originalPrice;
      } else {
          for (const productItem of userCart.products) {
              const { product, quantity } = productItem;
              if (!product) {
                  return res.status(400).json({ status: false, message: "Product not found in cart" });
              }
              orderedProducts.push({
                  product: product._id,
                  quantity,
                  name: product.name,
                  images: product.images || [],
                  originalPrice: product.originalPrice,
                  category: product.categoryName
              });
              cartTotal += product.originalPrice * quantity;
          }
      }

      // Create a new shipping address
      const savedShippingAddress = new ShippingAddress(shippingAddress);
      await savedShippingAddress.save();

      // Calculate the total amount (including the shipping charge)
      const deliveryCharge = 10; // Fixed delivery charge
      const totalAmount = cartTotal + deliveryCharge;

      // Create a new order document
      const order = new Order({
          userId,
          products: orderedProducts,
          paymentMethod,
          paymentIntentId: null,
          paymentIntent: {
              amount: totalAmount,
              status: paymentMethod === 'COD' ? 'Confirmed' : 'Pending',
              currency: "AED",
              shippingAddress: savedShippingAddress._id,
          },
          orderStatus: paymentMethod === 'COD' ? 'Confirmed' : 'Pending',
          deliveryCharge,
          processingStartTime: new Date(),
          shippingStartTime: new Date(),
      });

      // Save the order
      await order.save();

      // Update user orders and product quantities
      user.orders.push(order._id);
      await user.save();

      // Update product quantities (decrease based on order quantity)
      for (const orderedProduct of orderedProducts) {
          await Product.findByIdAndUpdate(
              orderedProduct.product,
              { $inc: { quantity: -orderedProduct.quantity, sold: orderedProduct.quantity } }
          );
      }

      // Respond with the order details
      res.status(201).json({
          status: true,
          message: "Order placed successfully",
          data: order
      });

  } catch (error) {
      console.error(error);
      res.status(500).json({
          status: false,
          message: "An error occurred while placing the order.",
          error: error.message
      });
  }
});

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ _id: -1 });
    res.send(orders);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getOrderByUser = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.id }).sort({ _id: -1 });
    res.send(orders);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    res.send(order);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateOrder = (req, res) => {
  const newStatus = req.body.status;
  Order.updateOne(
    {
      _id: req.params.id,
    },
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
          message: 'Order Updated Successfully!',
        });
      }
    }
  );
};

const deleteOrder = (req, res) => {
  Order.deleteOne({ _id: req.params.id }, (err) => {
    if (err) {
      res.status(500).send({
        message: err.message,
      });
    } else {
      res.status(200).send({
        message: 'Order Deleted Successfully!',
      });
    }
  });
};

const getUserOrder = (async (req, res) => {
  const { userId } = req.params;

  try {
      // Check if the user exists
      const userExists = await User.exists({ _id: userId });
      if (!userId || !userExists) {
          return res.status(400).send({ status: false, message: "Invalid user ID" });
      }

      // Find all orders for the user, sorted by createdAt in descending order
      const orders = await Order.find({ userId }).sort({ createdAt: -1 });

      // If no orders found, return error
      if (!orders || orders.length === 0) {
          return res.status(404).send({ status: false, message: "Orders not found" });
      }

      // Map each order to get the product details without modifying the delivery date
      const orderDetails = await Promise.all(orders.map(async (order) => {
          const products = await Promise.all(order.products.map(async (item) => {
              const product = await Product.findById(item.product._id);
              if (!product) {
                  throw new Error(`Product with ID ${item.product._id} not found`);
              }
              return {
                  product: {
                      _id: product._id,
                      title: product.name,
                      price: product.originalPrice,
                      images: product.images
                  },
                  quantity: item.quantity,
                  _id: item._id
              };
          }));
          const deliveredIn = order.deliveredIn;

          return {
              orderId: order._id,
              order: products,
              orderStatus: order.orderStatus,
              deliveredIn: deliveredIn
          };
      }));

      // Respond with order details
      res.status(200).send({
          status: true,
          orders: orderDetails
      });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send({ status: false, message: "Internal Server Error" });
  }
});


module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByUser,
  updateOrder,
  deleteOrder,
  getUserOrder
};
