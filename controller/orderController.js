const Order = require('../models/Order');
const User = require('../models/User')
const Product = require('../models/Product')
const Cart = require('../models/Cart')
const ShippingAddress = require('../models/ShippingAddress')
const PDFDocument = require('pdfkit');  // Import PDFKit



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

const deleteOrder = async (req, res) => {
  try {
      const { userId } = req.params;
      const { orderId } = req.body;

      // Check if user ID is provided
      if (!userId) {
          return res.status(400).send({ status: false, message: "Invalid user ID" });
      }

      // Find the user
      let user = await User.findById(userId);
      if (!user) {
          return res.status(400).send({ status: false, message: "User not found" });
      }

      // Ensure user.order is an array (even if it is undefined or null)
      if (!Array.isArray(user.order)) {
        user.order = []; // Initialize as an empty array if undefined or not an array
      }

      // Check if order ID is provided
      if (!orderId) {
          return res.status(400).send({ status: false, message: "Invalid order ID" });
      }

      // Find the order by ID
      let order = await Order.findById(orderId);
      if (!order) {
          return res.status(400).send({ status: false, message: "Order not found" });
      }

      // Remove the order from the user's order list
      user.order = user.order.filter(id => id.toString() !== orderId);

      // Save the updated user object
      user = await user.save();

      // Delete the order from the database
      await Order.findByIdAndDelete(orderId);

      // Return response with success message
      return res.status(200).send({
          status: true,
          message: "Order deleted successfully"
      });
  } catch (error) {
      console.error(error);
      res.status(500).send({ status: false, message: "Internal Server Error" });
  }
};


const cancelReasons = ['Change of mind', 'Incorrect item', 'Damaged item', 'Late delivery', 'Other'];

const cancelOrderFromUser = (async (req, res) => {
    const { userId } = req.params;
    const { 
        orderId, 
        cancelReasons 
    } = req.body;

    // Validate input
    if (!orderId || !cancelReasons) {
        return res.status(400).json({ status: false, message: "orderId and cancelReasons are required" });
    }

    try {
        // Find the order by ID
        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return res.status(404).json({ status: false, message: 'Order not found' });
        }

        // Check if the order is already cancelled
        if (order.isCancelled) {
            return res.status(400).json({ status: false, message: 'Order is already cancelled' });
        }

        // Check if the order is in a stage where it can't be cancelled
        if (order.orderStatus === 'Delivered' || order.orderStatus === 'Shipped') {
            return res.status(400).json({ status: false, message: 'Order cannot be cancelled at this stage' });
        }

        // Update the order status to 'CancelledRequest'
        const newOrderStatus = 'CancelledRequest'; // Change to 'CancelledRequest'
        order.orderStatus = newOrderStatus;
        order.isCancelled = true;
        order.cancelledAt = new Date();
        order.cancelReasons = cancelReasons;

        // Push the new status and timestamp to the orderStatusHistory
        order.orderStatusHistory.push({
            status: newOrderStatus,
            timestamp: new Date() // Current timestamp
        });

        // Save the updated order
        await order.save();

        return res.status(200).json({
            status: true,
            message: `Order cancelled by user userId: ${userId}`,
            data: order
        });

    } catch (error) {
        console.error('Error cancelling order:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error. Please try again later.' });
    }
});


const invoiceDownload = async (req, res) => {
  const { userId, orderId } = req.params;

  try {
    // Check if the user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(400).send({ status: false, message: "Invalid user ID" });
    }

    // Find the order by orderId for the specific user
    const order = await Order.findOne({ userId, _id: orderId });
    if (!order) {
      return res.status(404).send({ status: false, message: "Order not found" });
    }

    // Map products and create the PDF
    const products = await Promise.all(order.products.map(async (item) => {
      const product = await Product.findById(item.product._id);
      return {
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.originalPrice,
        totalAmount: product.originalPrice * item.quantity,
      };
    }));

    // Create a new PDF document
    const doc = new PDFDocument({ size: 'A4' });

    // Set the response to download the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);

    // Pipe the document to the response object
    doc.pipe(res);

    // Add Invoice Header
    doc.fontSize(20).font('Helvetica-Bold').text('Invoice', { align: 'center' });
    doc.moveDown();
    
    // Add Invoice ID, Date, and Status
    doc.fontSize(12).font('Helvetica').text(`Invoice ID: #${orderId}`, { align: 'left' });
    doc.text(`Creation Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'left' });
    doc.text(`Status: ${order.orderStatus}`, { align: 'left' });
    doc.moveDown();

    // Add "To" and user details (Use actual user data from the User model if necessary)
    doc.text(`To: ${userId}`, { align: 'left' });
    doc.text(`Address: Street, City`, { align: 'left' });
    doc.text(`Phone: 123-456-789`, { align: 'left' });
    doc.moveDown();

    // Add Table Header for Items (Use bold for headers)
    doc.fontSize(12).font('Helvetica-Bold').text('Items:', { align: 'left' });
    doc.moveDown();

    // Table Column Headers
    const tableStartY = doc.y;  // Start Y position for table headers
    const columnWidths = { description: 250, qty: 80, unitPrice: 100, amount: 100 }; // Set column widths
    doc.text('Description', 50, tableStartY);
    doc.text('Qty', 50 + columnWidths.description, tableStartY, { align: 'center' });
    doc.text('Unit Price', 50 + columnWidths.description + columnWidths.qty, tableStartY, { align: 'center' });
    doc.text('Amount', 50 + columnWidths.description + columnWidths.qty + columnWidths.unitPrice, tableStartY, { align: 'center' });
    doc.moveDown();

    // Draw line below headers for table
    doc.moveTo(50, doc.y).lineTo(50 + columnWidths.description + columnWidths.qty + columnWidths.unitPrice + columnWidths.amount, doc.y).stroke();

    // Add the order items in a loop with proper alignment
    products.forEach((item) => {
      doc.fontSize(10).font('Helvetica').text(item.productName, 50, doc.y);
      doc.text(item.quantity, 50 + columnWidths.description, doc.y, { align: 'center' });
      doc.text(`$${item.unitPrice.toFixed(2)}`, 50 + columnWidths.description + columnWidths.qty, doc.y, { align: 'center' });
      doc.text(`$${item.totalAmount.toFixed(2)}`, 50 + columnWidths.description + columnWidths.qty + columnWidths.unitPrice, doc.y, { align: 'center' });
      doc.moveDown();
    });

    // Draw line after table
    doc.moveTo(50, doc.y).lineTo(50 + columnWidths.description + columnWidths.qty + columnWidths.unitPrice + columnWidths.amount, doc.y).stroke();

    // Add Subtotal, Tax, and Total with proper alignment
    const subtotal = products.reduce((sum, item) => sum + item.totalAmount, 0);
    const tax = subtotal * 0.15; // 15% tax
    const totalAmount = subtotal + tax;

    doc.moveDown();
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`Tax (15%): $${tax.toFixed(2)}`, { align: 'right' });
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, { align: 'right' });
    doc.moveDown();

    // Add "Thank you" message at the end
    doc.fontSize(12).font('Helvetica').text('Thank you for your purchase!', { align: 'center' });
    doc.moveDown();

    // Finalize the PDF and send it to the response
    doc.end();

  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send({ status: false, message: "Internal Server Error" });
  }
};


module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByUser,
  updateOrder,
  deleteOrder,
  getUserOrder,
  cancelOrderFromUser,
  invoiceDownload
};
