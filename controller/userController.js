require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signInToken, tokenForVerify, sendEmail } = require('../config/auth');
const Cart = require('../models/Cart')
const Product = require('../models/Product')
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
    const users = await User.find({}).sort({ _id: -1 });
    res.send(users);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.send(user);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = req.body.name;
      user.email = req.body.email;
      user.address = req.body.address;
      user.phone = req.body.phone;
      user.image = req.body.image;
      const updatedUser = await user.save();
      const token = signInToken(updatedUser);
      res.send({
        token,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        address: updatedUser.address,
        phone: updatedUser.phone,
        image: updatedUser.image,
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
    const { quantity, productId, action } = req.body;

    // Fetch the user document
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(400).json({ status: false, message: "Invalid user ID" });
    }

    // Validate the product ID
    if (!productId) {
      return res.status(400).json({ status: false, message: "Invalid product ID" });
    }

    // Fetch the cart for the user
    let cart = await Cart.findOne({ userId });

    // If cart doesn't exist, create a new one
    if (!cart) {
      cart = new Cart({ userId, products: [] });
    }

    // Find the product item in the cart
    let productItem = cart.products.find(item => item.product && item.product.equals(productId));

    if (productItem) {
      // If product found in the cart
      if (action === 'increment') {
        // Increment the quantity by 1
        productItem.quantity += 1;
      } else if (action === 'decrement') {
        // Decrement the quantity by 1
        if (productItem.quantity > 0) {
          productItem.quantity -= 1;

          // If quantity reaches zero, remove the product from the cart
          if (productItem.quantity === 0) {
            cart.products = cart.products.filter(item => item.product && !item.product.equals(productId));
          }
        } else {
          return res.status(400).json({ status: false, message: "Quantity cannot be negative" });
        }
      } else {
        return res.status(400).json({ status: false, message: "Invalid action" });
      }
    } else {
      // If product is not found in the cart, add it as a new product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(400).json({ status: false, message: "Product not found" });
      }

      // Add new product to the cart with the given quantity
      cart.products.push({ product: productId, quantity });

      // Update the isInCart field to true
      await Product.findByIdAndUpdate(productId, { isInCart: true }, { new: true });
    }

    // Populate the product field in each productItem
    await Cart.populate(cart, { path: 'products.product', select: 'name originalPrice images isInCart' });

    // Calculate the subtotal and cartTotal
    let subTotal = 0;
    for (let item of cart.products) {
      if (item.product) {
        subTotal += item.product.originalPrice * item.quantity;
      }
    }

    // Update the subtotal and cartTotal in the cart
    cart.subTotal = subTotal;
    cart.cartTotal = subTotal; // Assuming cartTotal is the same as subTotal for now

    // Save the updated cart
    await cart.save();

    // Ensure the user.cart array is updated properly
    if (!user.cart.includes(productId)) {
      user.cart.push(productId);
    }

    // Save the updated user document
    await user.save();

    // Fetch the specific product details being updated
    const updatedProduct = await Product.findById(productId);
    if (!updatedProduct) {
      return res.status(400).json({ status: false, message: "Updated product not found" });
    }

    // Return the updated cart with details for the specific product only
    return res.status(200).json({
      status: true,
      message: "Product updated in cart",
      product: {
        name: updatedProduct.name, // Replaced title with name
        quantity: cart.products.find(item => item.product && item.product.equals(productId))?.quantity || 0,
        originalPrice: updatedProduct.originalPrice, // Replaced price with originalPrice
        images: updatedProduct.images,
        isInCart: updatedProduct.isInCart,
      },
      subTotal,
      cartTotal: cart.cartTotal,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//get cart 
const getCart = (async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user's cart by userId and populate the products
    const cart = await Cart.findOne({ userId })
      .populate({
        path: 'products.product',
        select: 'name originalPrice description images category'
      });

    if (!cart) {
      return res.status(200).json({
        status: true,
        cart: [],
        cartTotal: 0,
        subTotal: 0,
      });
    }

    // Filter out invalid products (null or undefined)
    const validProducts = cart.products.filter(item => item.product !== null);

    // Calculate cartTotal and subTotal
    let cartTotal = 0;
    let subTotal = 0;
    const cartDetails = validProducts.map(item => {
      const product = item.product;

      // Ensure the product is not null or undefined
      if (!product) {
        return null;
      }

      const itemTotal = product.originalPrice * item.quantity;
      cartTotal += itemTotal;
      subTotal += itemTotal;
      return {
        product: product._id,
        title: product.name,
        price: product.originalPrice,
        description: product.description,
        images: product.images,
        category: product.category,
        quantity: item.quantity,
        itemTotal,
      };
    }).filter(item => item !== null); // Filter out any null items

    // Update the cart if necessary
    if (cart.products.length !== validProducts.length) {
      cart.products = validProducts;
      await cart.save();
    }

    // Respond with the cart data
    res.status(200).json({
      status: true,
      cart: cartDetails,
      cartTotal,
      subTotal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: 'Internal server error' });
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
  getCart
};
