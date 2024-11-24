const express = require('express');
const { createStaff, getStaff, deleteStaff, updateStaff, getStaffById } = require('../controller/staffController.js');

const router = express.Router();

router.post('/create', createStaff); // Create a new staff member
router.get('/get', getStaff);        // Get all staff members
// Delete a staff member
router.delete('/:id', deleteStaff);

// Update a staff member
router.put('/:id', updateStaff);
router.get('/:id', getStaffById);

module.exports = router;
