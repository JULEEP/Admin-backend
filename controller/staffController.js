const Staff = require('../models/Staff');

// Create Staff
const createStaff = async (req, res) => {
  try {
    const { name, email, password, contactNumber, staffRole } = req.body;

    // Check if the email already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).send({ message: 'Email already exists.' });
    }

    // Create and save the staff member
    const newStaff = new Staff({
      name,
      email,
      password, // Ideally, hash the password before saving
      contactNumber,
      staffRole,
    });

    await newStaff.save();

    res.status(201).send({
      message: 'Staff created successfully!',
      newStaff,
    });
  } catch (error) {
    res.status(500).send({
      message: 'Failed to create staff member.',
      error: error.message,
    });
  }
};

// Get All Staff
const getStaff = async (req, res) => {
  try {
    const staffMembers = await Staff.find();
    res.status(200).send({
      message: 'Staff members retrieved successfully!',
      staffMembers,
    });
  } catch (error) {
    res.status(500).send({
      message: 'Failed to retrieve staff members.',
      error: error.message,
    });
  }
};

// Delete a staff member by ID
const deleteStaff = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedStaff = await Staff.findByIdAndDelete(id);
  
      if (!deletedStaff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
  
      res.status(200).json({ message: 'Staff member deleted successfully' });
    } catch (error) {
      console.error('Error deleting staff:', error);
      res.status(500).json({ message: 'An error occurred while deleting the staff member' });
    }
  };


// Update a staff member by ID
const updateStaff = async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
  
      const updatedStaff = await Staff.findByIdAndUpdate(id, updatedData, {
        new: true, // Return the updated document
        runValidators: true, // Ensure validation is applied
      });
  
      if (!updatedStaff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
  
      res.status(200).json({ 
        message: 'Staff member updated successfully', 
        staff: updatedStaff 
      });
    } catch (error) {
      console.error('Error updating staff:', error);
      res.status(500).json({ message: 'An error occurred while updating the staff member' });
    }
  };
  

// Get a single staff member by ID
const getStaffById = async (req, res) => {
    const { id } = req.params;
  
    try {
      // Fetch staff by ID
      const staff = await Staff.findById(id);
  
      if (!staff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
  
      // Respond with staff detailsssssss
      res.status(200).json(staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

module.exports = { createStaff, getStaff, deleteStaff, updateStaff, getStaffById };
