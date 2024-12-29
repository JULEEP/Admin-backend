const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  images: {
    type: [String], // Array of image URLs after overlay
  },
  nameText: {
    type: String, // Text overlay for name
  },
  templateUrl: {
    type: String, // URL of the template used (if applicable)
  },
  contactNumber: {
    type: String, // Text overlay for contact number
  },
  month: {
    type: String, // Text overlay for month
  },
  year: {
    type: String, // Text overlay for year
  },
  logoImageUrl: {
    type: String, // URL of the uploaded logo (if provided)
  },
  public_id: {
    type: String,
  },
  isTemplate: {
    type: Boolean,
    default: false, // True if the image is a template
  },
});

const Image = mongoose.model("Image", imageSchema);

module.exports =  Image;
