require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signInToken, tokenForVerify, sendEmail } = require('../config/auth');
const Cart = require('../models/Cart')
const Product = require('../models/Product')
const ShippingAddress = require('../models/ShippingAddress') 
const mongoose = require('mongoose')
const verifyEmailAddress = async (req, res) => {
  const isAdded = await User.findOne({ email: req.body.email });
  if (isAdded) {
    return res.status(403).send({
      message: 'This Email already Added!',
    });
  } else {
    const token = tokenForVerify(req.body);
    const body = {
      from: process.env.EMAIL_USER,
      to: `${req.body.email}`,
      subject: 'Email Activation',
      subject: 'Verify Your Email',
      html: `<h2>Hello ${req.body.email}</h2>
      <p>Verify your email address to complete the signup and login into your <strong>Fruitflix</strong> account.</p>

        <p>This link will expire in <strong> 15 minute</strong>.</p>

        <p style="margin-bottom:20px;">Click this link for active your account</p>

        <a href=${process.env.STORE_URL}/user/email-verification/${token} style="background:#22c55e;color:white;border:1px solid #22c55e; padding: 10px 15px; border-radius: 4px; text-decoration:none;">Verify Account</a>

        <p style="margin-top: 35px;">If you did not initiate this request, please contact us immediately at <a href='mailto:fruitflix.shop@gmail.com'>fruitflix.shop@gmail.com</a></p>

        <p style="margin-bottom:0px;">Thank you</p>
        <strong>FruitFlix Team</strong>
             `,
    };

    const message = 'Please check your email to verify!';
    sendEmail(body, res, message);
  }
};

const registerUser = async (req, res) => {
  const token = req.params.token;
  const { name, email, password } = jwt.decode(token);
  const isAdded = await User.findOne({ email: email });

  if (isAdded) {
    const token = signInToken(isAdded);
    return res.send({
      token,
      name: isAdded.name,
      email: isAdded.email,
      message: 'Email Already Verified!',
    });
  }

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_FOR_VERIFY, (err, decoded) => {
      if (err) {
        return res.status(401).send({
          message: 'Token Expired, Please try again!',
        });
      } else {
        const newUser = new User({
          name,
          email,
          password: bcrypt.hashSync(password),
        });
        newUser.save();
        const token = signInToken(newUser);
        res.send({
          token,
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          message: 'Email Verified, Please Login Now!',
        });
      }
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.registerEmail });

    if (
      user &&
      user.password &&
      bcrypt.compareSync(req.body.password, user.password)
    ) {
      const token = signInToken(user);
      res.send({
        token,
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        phone: user.phone,
        image: user.image,
      });
    } else {
      res.status(401).send({
        message: 'Invalid user or password!',
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const forgetPassword = async (req, res) => {
  const isAdded = await User.findOne({ email: req.body.verifyEmail });
  if (!isAdded) {
    return res.status(404).send({
      message: 'User Not found with this email!',
    });
  } else {
    const token = tokenForVerify(isAdded);
    const body = {
      from: process.env.EMAIL_USER,
      to: `${req.body.verifyEmail}`,
      subject: 'Password Reset',
      html: `<h2>Hello ${req.body.verifyEmail}</h2>
      <p>A request has been received to change the password for your <strong>Kachabazar</strong> account </p>

        <p>This link will expire in <strong> 15 minute</strong>.</p>

        <p style="margin-bottom:20px;">Click this link for reset your password</p>

        <a href=${process.env.STORE_URL}/user/forget-password/${token} style="background:#22c55e;color:white;border:1px solid #22c55e; padding: 10px 15px; border-radius: 4px; text-decoration:none;">Reset Password</a>

        <p style="margin-top: 35px;">If you did not initiate this request, please contact us immediately at support@kachabazar.com</p>

        <p style="margin-bottom:0px;">Thank you</p>
        <strong>Kachabazar Team</strong>
             `,
    };

    const message = 'Please check your email to reset password!';
    sendEmail(body, res, message);
  }
};

const resetPassword = async (req, res) => {
  const token = req.body.token;
  const { email } = jwt.decode(token);
  const user = await User.findOne({ email: email });

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_FOR_VERIFY, (err, decoded) => {
      if (err) {
        return res.status(500).send({
          message: 'Token expired, please try again!',
        });
      } else {
        user.password = bcrypt.hashSync(req.body.newPassword);
        user.save();
        res.send({
          message: 'Your password change successful, you can login now!',
        });
      }
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user.password) {
      return res.send({
        message:
          'For change password,You need to sign in with email & password!',
      });
    } else if (
      user &&
      bcrypt.compareSync(req.body.currentPassword, user.password)
    ) {
      user.password = bcrypt.hashSync(req.body.newPassword);
      await user.save();
      res.send({
        message: 'Your password change successfully!',
      });
    } else {
      res.status(401).send({
        message: 'Invalid email or current password!',
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const signUpWithProvider = async (req, res) => {
  try {
    const isAdded = await User.findOne({ email: req.body.email });
    if (isAdded) {
      const token = signInToken(isAdded);
      res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        address: isAdded.address,
        phone: isAdded.phone,
        image: isAdded.image,
      });
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        image: req.body.image,
      });

      const user = await newUser.save();
      const token = signInToken(user);
      res.send({
        token,
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    // Get the search query from the request
    const { search } = req.query;

    // Build the filter object
    const filter = search
      ? {
          $or: [
            { phoneNumber: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { fullName: { $regex: search, $options: 'i' } },
            { Status: { $regex: search, $options: 'i' } },
            // Add more fields here if needed
          ]
        }
      : {};

    // Fetch users with optional filtering, sorted by _id in descending order
    const users = await User.find(filter).sort({ _id: -1 });

    // Send the filtered users
    res.send(users);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};


const getUserById = async (req, res) => {
  try {
    // Find the user by ID and select only specific fields
    const user = await User.findById(req.params.userId)
      .select('fullName email phoneNumber Status');  // Select only these fields

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.send(user);  // Send the user data with the selected fields
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};


const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (user) {
      user.fullName = req.body.fullName;
      user.email = req.body.email;
      user.address = req.body.address;
      user.phone = req.body.phone;
      const updatedUser = await user.save();
      const token = signInToken(updatedUser);
      res.send({
        token,
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        address: updatedUser.address,
        phone: updatedUser.phone,
      });
    }
  } catch (err) {
    res.status(404).send({
      message: 'Your email is not valid!',
    });
  }
};

const deleteUser = (req, res) => {
  User.deleteOne({ _id: req.params.id }, (err) => {
    if (err) {
      res.status(500).send({
        message: err.message,
      });
    } else {
      res.status(200).send({
        message: 'User Deleted Successfully!',
      });
    }
  });
};

const userCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { quantity, productId, variationId, action } = req.body;

    // Fetch the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ status: false, message: "Invalid user ID" });
    }

    if (!productId) {
      return res.status(400).json({ status: false, message: "Invalid product ID" });
    }

    // Fetch or create the user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, products: [] });
    }

    // Fetch the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({ status: false, message: "Product not found" });
    }

    let variationDetails = null;
    let variationPrice = product.originalPrice;

    // Fetch variation details if variationId is provided
    if (variationId) {
      const variation = product.variations.find(v => v._id.toString() === variationId.toString());
      if (!variation) {
        return res.status(400).json({ status: false, message: "Variation not found" });
      }
      variationPrice = variation.price;
      variationDetails = {
        paperName: variation.paperName,
        price: variation.price,
        paperSize: variation.paperSize,
        color: variation.color,
      };
    }

    cart.variationId = variationId; // Save variationId
    cart.variationDetails = variationDetails; // Save expanded variation details

    // Check if the product is already in the cart
    let productItem = cart.products.find(item => item.product.equals(productId));
    if (productItem) {
      // Update quantity based on action
      if (action === 'increment') {
        productItem.quantity += quantity;
      } else if (action === 'decrement') {
        productItem.quantity -= quantity;
        if (productItem.quantity <= 0) {
          cart.products = cart.products.filter(item => !item.product.equals(productId));
        }
      }
    } else {
      // Add the product with its variation to the cart
      cart.products.push({
        product: productId,
        quantity,
        price: variationPrice,
      });
    }

    // Calculate totals
    let subTotal = 0;
    cart.products.forEach(item => {
      subTotal += item.price * item.quantity;
    });

    cart.subTotal = subTotal;
    cart.cartTotal = subTotal;

    // Save the cart
    await cart.save();

    // Populate product details for response
    await cart.populate({ path: 'products.product', select: 'name originalPrice images' });

    return res.status(200).json({
      status: true,
      message: "Cart updated successfully",
      cart: {
        _id: cart._id,
        userId: cart.userId,
        products: cart.products.map(item => ({
          _id: item._id,
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          images: item.product?.images || [],
        })),
        variationId: cart.variationId,
        variationDetails: cart.variationDetails,
        subTotal: cart.subTotal,
        cartTotal: cart.cartTotal,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};





const getCart = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user's cart by userId
    const cart = await Cart.findOne({ userId }).populate({
      path: 'products.product',
      select: 'name originalPrice images', // Fetch only necessary fields for products
    });

    if (!cart) {
      return res.status(200).json({
        status: true,
        cart: [],
      });
    }

    // Return the cart along with variationDetails and other fields
    res.status(200).json({
      status: true,
      cart: {
        _id: cart._id,
        userId: cart.userId,
        products: cart.products.map(product => ({
          _id: product._id,
          product: product.product, // Includes populated product details
          quantity: product.quantity,
          price: product.price,
          images: product.product?.images || [],
        })),
        variationId: cart.variationId,
        variationDetails: cart.variationDetails
          ? {
              paperName: cart.variationDetails.paperName,
              price: cart.variationDetails.price,
              paperSize: cart.variationDetails.paperSize,
              color: cart.variationDetails.color,
            }
          : null, // Include variation details or null if not present
        subTotal: cart.subTotal,
        cartTotal: cart.cartTotal,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: 'Internal server error' });
  }
};





//delete cart
const deleteCartItem = (async (req, res) => {
  try {
      const { userId } = req.params;
      const { productId } = req.body;

      // Validate userId and productId
      if (!userId || !productId) {
          return res.status(400).json({ status: false, message: "Invalid userId or productId" });
      }

      // Find the user and cart
      const user = await User.findById(userId);
      const cart = await Cart.findOne({ userId });

      if (!user || !cart) {
          return res.status(404).json({ status: false, message: "User or cart not found" });
      }

      // Remove the product from the cart
      const productIndex = cart.products.findIndex(item => item.product && item.product.toString() === productId);
      
      if (productIndex === -1) {
          return res.status(404).json({ status: false, message: "Product not found in cart" });
      }

      // Remove the product from cart and recalculate the cart total
      cart.products.splice(productIndex, 1);

      // Calculate the new cart total and subTotal
      let cartTotal = 0;
      cart.products.forEach(item => {
          if (item.product && item.quantity) {
              const quantity = item.quantity;
              const price = item.product.price || 0;
              cartTotal += quantity * price;
          }
      });

      cart.cartTotal = cartTotal;
      cart.subTotal = cartTotal;

      // Save the updated cart
      await cart.save();

      // Return a success response
      res.status(200).json({
          status: true,
          message: "Product removed from cart successfully",
          cart,
      });
  } catch (error) {
      console.error("Error in deleteCartItem:", error);
      res.status(500).json({ status: false, message: "Internal server error" });
  }
});

const getShippingAddress = (async (req, res) => {
  const { userId } = req.params;
  try {
    const shippingAddress = await ShippingAddress.findOne({ userId });
    if (!shippingAddress) {
      return res.status(404).json({ status: false, message: "Shipping address not found" });
    }
    res.status(200).json({ status: true, message: "Shipping address retrieved successfully", shippingAddress });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
});


const addToWishlist = async (req, res) => {
  const { userId } = req.params; // User ID from URL params
  const { productId } = req.body; // Product ID from the request body

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Check if the product is already in the wishlist
    const alreadyAdded = user.wishlist.includes(productId);

    if (alreadyAdded) {
      // If the product is already in the wishlist, remove it and set isInWishlist to false
      await User.findByIdAndUpdate(
        userId,
        { $pull: { wishlist: productId } }, // Remove product from user's wishlist
        { new: true }
      );

      await Product.findByIdAndUpdate(
        productId,
        { isInWishlist: false }, // Set product's isInWishlist to false
        { new: true }
      );

      // Return response for removed product
      return res.status(200).json({
        status: true,
        message: "Product removed from wishlist",
        isInWishlist: false,
      });
    } else {
      // If the product is not in the wishlist, add it and set isInWishlist to true
      await User.findByIdAndUpdate(
        userId,
        { $push: { wishlist: productId } }, // Add product to user's wishlist
        { new: true }
      );

      await Product.findByIdAndUpdate(
        productId,
        { isInWishlist: true }, // Set product's isInWishlist to true
        { new: true }
      );

      // Return response for added product
      return res.status(200).json({
        status: true,
        message: "Product added to wishlist",
        isInWishlist: true,
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};


//get wishllist
const getWishlist = (async (req, res) => {
  const { userId } = req.params;

  try {
      // Find user by ID and populate wishlist with product details
      const user = await User.findById(userId)
          .populate({
              path: 'wishlist',
              select: 'title  name originalPrice description images category', // Specify the fields to populate
          });

      // Check if user exists
      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      // Respond with the user's wishlist
      res.json({ message: "Your wishlist is here", wishlist: user.wishlist });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});






module.exports = {
  loginUser,
  registerUser,
  signUpWithProvider,
  verifyEmailAddress,
  forgetPassword,
  changePassword,
  resetPassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  userCart,
  getCart,
  deleteCartItem,
  getShippingAddress,
  addToWishlist,
  getWishlist
};
