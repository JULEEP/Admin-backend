const express = require('express');
const router = express.Router();
const {
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
} = require('../controller/userController');
const {
  passwordVerificationLimit,
  emailVerificationLimit,
} = require('../config/others');

//verify email
router.post('/verify-email', emailVerificationLimit, verifyEmailAddress);

//register a user
router.post('/register', registerUser);

//login a user
router.post('/login', loginUser);

//register or login with google and fb
router.post('/signup', signUpWithProvider);

//forget-password
router.put('/forget-password', passwordVerificationLimit, forgetPassword);

//reset-password
router.put('/reset-password', resetPassword);

//change password
router.post('/change-password', changePassword);

//get all user
router.get('/', getAllUsers);

//get a user
router.get('/:userId', getUserById);

//update a user
router.put('/update-user/:userId', updateUser);

//delete a user
router.delete('/:id', deleteUser);
router.post("/cart/:userId", userCart)
router.get("/getcart/:userId", getCart)
router.delete('/delete-cart/:userId', deleteCartItem);
router.get('/get-shipping-address/:userId', getShippingAddress);
router.post('/wishlist/:userId', addToWishlist)
router.get("/get-wishlist/:userId", getWishlist);






module.exports = router;
