const cloudinary = require('cloudinary').v2;
require('dotenv').config(); // To load your environment variables

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

module.exports = cloudinary; // Export cloudinary for use in other parts of the app
