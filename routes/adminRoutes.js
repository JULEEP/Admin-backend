const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  forgetPassword,
  resetPassword,
  addStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  logout,
  updateProfile
} = require('../controller/adminController');
const { passwordVerificationLimit } = require('../config/others');

//register a staff
router.post('/register', registerAdmin);

//login a admin
router.post('/login', loginAdmin);
router.post('/logout', logout)

//forget-password
router.put('/forget-password', passwordVerificationLimit, forgetPassword)
router.put('/profile/:id', updateProfile);


//reset-password
router.put('/reset-password', resetPassword);

//add a staff
router.post('/add', addStaff);
//get all staff
router.post('/', getAllStaff);

//get a staff
router.post('/:id', getStaffById);

//update a staff
router.put('/:id', updateStaff);

//delete a staff
router.delete('/:id', deleteStaff);

module.exports = router;
