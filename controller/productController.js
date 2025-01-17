const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
const Image = require('../models/Image')
const sharp = require("sharp");
const fs = require("fs/promises");
const cloudinary = require('../config/cloudinary')





const addProduct = async (req, res) => {
  try {
    const { 
      name, 
      category, 
      slug, 
      description, 
      size, 
      color, 
      moq, 
      originalPrice, 
      discountedPrice, 
      type, 
      quantity, 
      unit, 
      subcategory, 
      images, 
      paperSizes = '', // Default to an empty string if not provided
      paperNames = '', // Default to an empty string if not provided
      colors = '', // Default to an empty string if not provided
      quantities = '', // Default to an empty string if not provided
    } = req.body;

    // Convert the comma-separated strings to arrays
    const paperSizesArray = paperSizes.split(',').map(size => size.trim()).filter(size => size);
    const paperNamesArray = paperNames.split(',').map(name => name.trim()).filter(name => name);
    const colorsArray = colors.split(',').map(color => color.trim()).filter(color => color);
    const quantitiesArray = quantities.split(',').map(quantity => quantity.trim()).filter(quantity => quantity);

    // Check if required arrays are provided and are non-empty
    if (paperSizesArray.length === 0) {
      return res.status(400).json({ message: 'Paper sizes must be provided as a non-empty array.' });
    }
    if (paperNamesArray.length === 0) {
      return res.status(400).json({ message: 'Paper names must be provided as a non-empty array.' });
    }
    if (colorsArray.length === 0) {
      return res.status(400).json({ message: 'Colors must be provided as a non-empty array.' });
    }
    if (quantitiesArray.length === 0) {
      return res.status(400).json({ message: 'Quantities must be provided as a non-empty array.' });
    }

    // Array to hold all product variations
    let productVariations = [];

    // Loop through all combinations of paper sizes, names, colors, and quantities
    for (let i = 0; i < paperSizesArray.length; i++) {
      for (let j = 0; j < paperNamesArray.length; j++) {
        for (let k = 0; k < colorsArray.length; k++) {
          for (let l = 0; l < quantitiesArray.length; l++) {
            // Calculate price based on paper size, name, color, and quantity
            let adjustedPrice = originalPrice; // Start with the original price

            // Apply price adjustments for different combinations
            if (paperSizesArray[i] === 'A3') {
              adjustedPrice += 10; // Additional price for A3 paper size
            }
            if (paperNamesArray[j] === 'Glossy') {
              adjustedPrice += 5; // Additional price for glossy paper
            }
            if (colorsArray[k] === 'Black') {
              adjustedPrice += 2; // Additional price for black color
            }

            // Adjust price by multiplying by quantity at the end
            let totalPrice = adjustedPrice * quantitiesArray[l]; // This is the correct logic

            // Create a variation for this combination
            productVariations.push({
              paperSize: paperSizesArray[i],
              paperName: paperNamesArray[j],
              color: colorsArray[k],
              quantity: quantitiesArray[l],
              price: totalPrice, // Store total price for this variation
            });
          }
        }
      }
    }

    // Create the product with variations
    const newProduct = new Product({
      name: name || '',
      category: category || '',
      slug: slug || '',
      description: description || '',
      size: size || '',
      color: color || '',
      moq: moq || 0,
      originalPrice: originalPrice || 0,
      discountedPrice: discountedPrice || 0,
      type: type || '',
      quantity: quantity || 0,
      unit: unit || '',
      subcategory: subcategory || '', // Add subcategory
      images: [], // Assuming image handling will be done separately
      variations: productVariations, // Store product variations
    });

    // Handle image uploads to Cloudinary
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.uploader.upload(req.files[i].path, {
          upload_preset: 'custom', // Your preset for Cloudinary upload
        });

        newProduct.images.push(result.secure_url); // Store the Cloudinary URL of each image
      }
    }

    // Save product to the database
    await newProduct.save();

    res.status(200).json({
      message: 'Product added successfully!',
      newProduct,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addAllProducts = async (req, res) => {
  try {
    const { body, query } = req;

    // Filter products based on required fields (e.g., name, price, category)
    const filteredProducts = body.filter(product => {
      // Ensure the product has essential fields like name, price, and category
      if (!product.name || !product.price || !product.category) {
        return false;
      }

      // Check if the price is a valid positive number
      if (product.price <= 0) {
        return false;
      }

      return true;
    });

    // If no valid products after filtering, return an error
    if (filteredProducts.length === 0) {
      return res.status(400).send({
        message: 'No valid products to add.',
      });
    }

    // Remove duplicates based on product name (or any unique field)
    const uniqueProducts = [];
    const seenNames = new Set();

    filteredProducts.forEach(product => {
      if (!seenNames.has(product.name)) {
        seenNames.add(product.name);
        uniqueProducts.push(product);
      }
    });

    // Sorting based on 'sortBy' query parameter, if provided
    if (query.sortBy) {
      switch (query.sortBy) {
        case 'recently_added':
          // Sort by the date added (assuming you have a 'createdAt' field in the product schema)
          uniqueProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'price_desc':
          // Sort by price, from higher to lower
          uniqueProducts.sort((a, b) => b.price - a.price);
          break;
        case 'price_asc':
          // Sort by price, from lower to higher
          uniqueProducts.sort((a, b) => a.price - b.price);
          break;
        default:
          // No sorting, keep the original order
          break;
      }
    }

    // Delete all existing products and insert the filtered, unique, and sorted products
    await Product.deleteMany();
    await Product.insertMany(uniqueProducts);

    res.status(200).send({
      message: 'Products added successfully!',
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};


const getShowingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'Show' }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getDiscountedProducts = async (req, res) => {
  try {
    const products = await Product.find({ discount: { $gt: 5 } }).sort({
      _id: -1,
    });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};
const getAllProductsBySearh = async (req, res) => {
  const { name, description, category } = req.query;  // Get query parameters from the request

  try {
    // Build the query object dynamically based on the parameters passed in the URL
    let query = {};

    if (name) {
      query.name = { $regex: name, $options: 'i' };  // Case-insensitive search for name
    }
    if (description) {
      query.description = { $regex: description, $options: 'i' };  // Case-insensitive search for description
    }
    if (category) {
      query.category = { $regex: category, $options: 'i' };  // Case-insensitive search for category
    }

    // Find products matching the query parameters
    const products = await Product.find(query).sort({ _id: -1 });

    // Send the results as a response
    res.send(products);
  } catch (err) {
    // Handle errors
    res.status(500).send({
      message: err.message,
    });
  }
};


const getAllProductsByCategory = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Hordings" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategoryFliers = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Fliers" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategorySchool = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "School" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategoryCanvas = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Canvas Printing" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategoryAcrylic = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Acrylic Printing" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategoryBanks = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Banks" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategoryBillBooks = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Bill Books" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProductsByCategoryCards = async (req, res) => {
  try {
    // Filter products where the category is "Hordings" and sort by _id in descending order
    const products = await Product.find({ category: "Cards" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};


const getStockOutProducts = async (req, res) => {
  try {
    const products = await Product.find({ quantity: { $lt: 1 } }).sort({
      _id: -1,
    });

    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    res.send(product);
  } catch (err) {
    res.status(500).send({
      message: `Slug problem, ${err.message}`,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.send(product);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.sku = req.body.sku;
      product.title = req.body.title;
      product.slug = req.body.slug;
      product.description = req.body.description;
      product.parent = req.body.parent;
      product.children = req.body.children;
      product.type = req.body.type;
      product.unit = req.body.unit;
      product.quantity = req.body.quantity;
      product.originalPrice = req.body.originalPrice;
      product.price = req.body.price;
      product.discount = req.body.discount;
      product.image = req.body.image;
      product.tag = req.body.tag;
      await product.save();
      res.send({ data: product, message: 'Product updated successfully!' });
    }
    // handleProductStock(product);
  } catch (err) {
    res.status(404).send(err.message);
  }
};

const updateStatus = (req, res) => {
  const newStatus = req.body.status;
  Product.updateOne(
    { _id: req.params.id },
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
          message: `Product ${newStatus} Successfully!`,
        });
      }
    }
  );
};

const deleteProduct = (req, res) => {
  Product.deleteOne({ _id: req.params.id }, (err) => {
    if (err) {
      res.status(500).send({
        message: err.message,
      });
    } else {
      res.status(200).send({
        message: 'Product Deleted Successfully!',
      });
    }
  });
};

const getSimilarProducts = async (req, res) => {
  try {
    const { filterBy } = req.query;  // Get the filter type (price or name) from the query string
    const { value } = req.body;  // Get the value to filter by (either price or name)

    // Check if the 'value' and 'filterBy' parameters are provided
    if (!value || !filterBy) {
      return res.status(400).send({ message: "Both 'value' and 'filterBy' are required" });
    }

    let query = {};

    // Define the filter condition based on filterBy parameter
    if (filterBy === 'price') {
      query = { originalPrice: value };  // Find products with the same originalPrice
    } else if (filterBy === 'name') {
      query = { name: { $regex: value, $options: 'i' } };  // Find products with similar name
    } else {
      return res.status(400).send({ message: "Invalid filter. Use 'price' or 'name'" });
    }

    // Find similar products based on the query
    const similarProducts = await Product.find(query).sort({ _id: -1 });

    // If no similar products are found
    if (similarProducts.length === 0) {
      return res.status(404).send({ message: "No similar products found" });
    }

    // Return the list of similar products
    res.status(200).json(similarProducts);

  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Search Controller
const searchProducts = async (req, res) => {
  const { query } = req.query;

  try {
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    // Search Products by name, description, or category (you can modify the fields as needed)
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
      ],
    });

    return res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /pdf|jpeg|jpg|png|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = file.mimetype.startsWith('application/pdf') || file.mimetype.startsWith('image/');

    if (extName && mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF or image files are allowed!'));
    }
  },
}).single('file'); // Field name for the file input

// Controller to handle design upload
const uploadDesign = async (req, res) => {
  try {
    const productId = req.params.id; // Product ID from the route

    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded!' });
      }

      // Get the uploaded file path
      const designPath = `/uploads/${req.file.filename}`;

      // Find the product and update the myDesigns array
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found!' });
      }

      // Add the new design path to the myDesigns array
      product.myDesigns.push(designPath);

      await product.save();

      res.status(200).json({
        message: 'Design uploaded successfully!',
        product,
      });
    });
  } catch (error) {
    console.error('Error uploading design:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const submitRating = async (req, res) => {
  const { productId, rating, comment } = req.body;
  const { userId } = req.params; // Get userId from the URL params

  // Check if the rating is valid
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating should be between 1 and 5" });
  }

  try {
    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user has already rated this product
    const existingRating = product.ratings.find(rating => rating.userId.toString() === userId);
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this product' });
    }

    // Create the new rating
    const newRating = {
      userId,
      rating,
      comment,
      createdAt: new Date(), // Set the `createdAt` field manually
    };

    // Add the new rating to the product
    product.ratings.push(newRating);

    // Recalculate the average rating
    product.averageRating = product.calculateAverageRating();
    product.reviewCount = product.ratings.length; // Update review count

    // Save the product with the new rating
    await product.save();

    return res.status(201).json({
      message: 'Rating submitted successfully!',
      product: product,
      ratings: newRating, // Include `createdAt` in the response
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};



// Get Ratings for a Product
const getProductRatings = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id)
      .populate({
        path: 'ratings',
        select: 'createdAt rating comment', // Ensure createdAt is included here
        populate: {
          path: 'userId',
          select: 'fullName email', // Select `fullName` and `email` fields of the user
        },
      });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate average rating and count
    const ratingCount = product.ratings.length;
    const averageRating = ratingCount > 0
      ? product.ratings.reduce((acc, rating) => acc + rating.rating, 0) / ratingCount
      : 0;

    // Format the createdAt date for each rating
    const formattedRatings = product.ratings.map(rating => {
      const formattedDate = new Date(rating.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      return {
        ...rating.toObject(),
        createdAt: formattedDate, // Replace the original createdAt with the formatted one
      };
    });

    return res.status(200).json({
      ratings: formattedRatings,
      averageRating: averageRating.toFixed(1), // Round average to 1 decimal place
      ratingCount: ratingCount, // Count the number of ratings
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


const generateInvitation = async (req, res) => {
  try {
    // Handle file upload
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || 'File upload failed.' });
      }

      const { productId, phoneNumber, emailAddress } = req.body; // Assuming these values are sent in the request

      // Fetch product from DB
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      // Process PDF file
      if (req.file && req.file.mimetype === 'application/pdf') {
        const filePath = req.file.path;

        // Read the PDF file
        const existingPdfBytes = fs.readFileSync(filePath);

        // Use pdf-parse to extract text from the PDF
        const data = await pdfParse(existingPdfBytes);

        // Extracted text from the PDF (you can use this for reference if needed)
        const extractedText = data.text;

        // Load the PDF with pdf-lib
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Get the first page of the document
        const page = pdfDoc.getPages()[0];

        // Default coordinates for adding text
        const x = 50;  // X coordinate for the text
        let y = 600;   // Y coordinate for the text, adjust based on where you want to place it

        // Add phone number to PDF
        if (phoneNumber) {
          page.drawText(`Phone: ${phoneNumber}`, {
            x,
            y,
            size: 12,
            color: rgb(0, 0, 0), // Black text color
          });
          y -= 20;  // Move the y-position down for the next line
        }

        // Add email address to PDF
        if (emailAddress) {
          page.drawText(`Email: ${emailAddress}`, {
            x,
            y,
            size: 12,
            color: rgb(0, 0, 0), // Black text color
          });
          y -= 20;  // Move the y-position down for the next line
        }

        // You can add more details here as needed (like recipient name, event, etc.)

        // Save the modified PDF
        const updatedPdfBytes = await pdfDoc.save();

        // Define a new file path for the updated PDF
        const updatedFilePath = filePath.replace('.pdf', '-updated.pdf');

        // Save the updated PDF to the file system
        fs.writeFileSync(updatedFilePath, updatedPdfBytes);

        // Save the updated card entry with the new file and extracted text
        const cardEntry = {
          fileName: req.file.filename.replace('.pdf', '-updated.pdf'),
          filePath: updatedFilePath,
          extractedText,  // Store the extracted text
        };

        // Add the card entry to the product's generateCard array
        product.generateCard.push(cardEntry);
        await product.save();

        // Send the updated PDF as the response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${cardEntry.fileName}"`);

        const fileStream = fs.createReadStream(updatedFilePath);
        fileStream.pipe(res);
      } else {
        res.status(400).json({ message: 'Unsupported file type. Only PDF files are allowed.' });
      }
    });
  } catch (error) {
    console.error('Error in generateInvitation:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};



const updateInvitation = async (req, res) => {
  try {
    const { 
      productId, 
      cardId, 
      recipientName, 
      eventName, 
      date, 
      location, 
      host, 
      eventPurpose 
    } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId format.' });
    }

    // Fetch product from DB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Find the card in the generateCard array to update
    const cardIndex = product.generateCard.findIndex(card => card._id.toString() === cardId);
    if (cardIndex === -1) {
      return res.status(404).json({ message: 'Invitation card not found.' });
    }

    // Retrieve the existing card details
    const card = product.generateCard[cardIndex];

    // Path to the original PDF
    const filePath = card.filePath;

    // Read the existing PDF
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the first page of the document (assuming data is on the first page)
    const page = pdfDoc.getPages()[0];

    // We will replace the existing content with new content.
    // This assumes you're replacing static text like `Samantha` with `Julee`.

    // Define the x, y coordinates for each text that needs to be replaced
    // Adjust these coordinates based on the exact positions in your PDF

    // For 'recipientName' (Assuming 'Samantha' is at this position)
    if (recipientName) {
      page.drawText(recipientName, {
        x: 100, // Adjust this to the actual x position
        y: 550, // Adjust Y coordinate as per the PDF layout
        size: 18,
        color: rgb(0, 0, 0), // Black color
      });
    }

    // For 'eventName' (Assuming it's at this position)
    if (eventName) {
      page.drawText(eventName, {
        x: 100, // Adjust for eventName position
        y: 530, // Adjust Y coordinate
        size: 18,
        color: rgb(0, 0, 0), // Black color
      });
    }

    // Similarly for other fields like 'location', 'date', 'host', 'eventPurpose'
    if (location) {
      page.drawText(location, {
        x: 100, // Adjust for location
        y: 510, // Adjust Y coordinate
        size: 18,
        color: rgb(0, 0, 0), // Black color
      });
    }

    if (date) {
      page.drawText(date, {
        x: 100, // Adjust for date
        y: 490, // Adjust Y coordinate
        size: 18,
        color: rgb(0, 0, 0), // Black color
      });
    }

    if (host) {
      page.drawText(host, {
        x: 100, // Adjust for host
        y: 470, // Adjust Y coordinate
        size: 18,
        color: rgb(0, 0, 0), // Black color
      });
    }

    if (eventPurpose) {
      page.drawText(eventPurpose, {
        x: 100, // Adjust for eventPurpose
        y: 450, // Adjust Y coordinate
        size: 18,
        color: rgb(0, 0, 0), // Black color
      });
    }

    // Save the updated PDF
    const updatedPdfBytes = await pdfDoc.save();

    // Define a new file path for the updated PDF
    const updatedFilePath = path.join(__dirname, 'uploads', `updated_${card.fileName}`);

    // Save the updated PDF to the file system
    fs.writeFileSync(updatedFilePath, updatedPdfBytes);

    // Update the card's metadata
    card.fileName = `updated_${card.fileName}`;
    card.filePath = updatedFilePath;
    card.extractedText = `Updated text content with new values: ${recipientName}, ${eventName}, ${date}, ${location}, ${host}, ${eventPurpose}`; // Update extractedText field

    // Save the updated product details to the database
    await product.save();

    // Send the updated PDF as the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${card.fileName}"`);

    const fileStream = fs.createReadStream(updatedFilePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error in updateInvitation:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};




const editPdfAndUploadToProduct = async (req, res) => {
  try {
    // Extract product ID and replacement text from request body
    const { id, invoiceText, partnerText } = req.body;

    // Find the product by its ID
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // File path of the uploaded original PDF
    const filePath = req.file.path;
    const existingPdfBytes = fs.readFileSync(filePath);

    // Load and modify the PDF
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Embed a font for adding new text
    const font = await pdfDoc.embedFont(PDFDocument.PDFName.of('Helvetica'));

    // Get the first page of the PDF
    const page = pdfDoc.getPages()[0];

    // Erase and replace the text dynamically
    const eraseAreaInvoice = { x: 50, y: 750, width: 200, height: 30 }; // Coordinates for 'INVOICE'
    page.drawRectangle({
      x: eraseAreaInvoice.x,
      y: eraseAreaInvoice.y,
      width: eraseAreaInvoice.width,
      height: eraseAreaInvoice.height,
      color: rgb(1, 1, 1), // White background to erase
    });

    const eraseAreaPartner = { x: 50, y: 720, width: 300, height: 30 }; // Coordinates for 'Aldenaire & Partners'
    page.drawRectangle({
      x: eraseAreaPartner.x,
      y: eraseAreaPartner.y,
      width: eraseAreaPartner.width,
      height: eraseAreaPartner.height,
      color: rgb(1, 1, 1),
    });

    // Add the new text
    page.drawText(invoiceText || 'INVOICE', {
      x: eraseAreaInvoice.x + 5,
      y: eraseAreaInvoice.y + 10,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(partnerText || 'Aldenaire & Partners', {
      x: eraseAreaPartner.x + 5,
      y: eraseAreaPartner.y + 10,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    const modifiedFileName = `modified_invoice_${Date.now()}.pdf`;
    const modifiedFilePath = `./uploads/${modifiedFileName}`;
    fs.writeFileSync(modifiedFilePath, modifiedPdfBytes);

    // Add the modified PDF details to the product's generateCard array
    const cardEntry = {
      id: Date.now().toString(), // Generate a unique ID for the card
      fileName: modifiedFileName,
      filePath: modifiedFilePath,
    };
    product.generateCard.push(cardEntry);

    // Save the updated product
    await product.save();

    // Send response with product details and card entry
    res.status(200).json({
      message: 'PDF modified and uploaded successfully.',
      productId: product._id,
      cardEntry,
    });
  } catch (error) {
    console.error('Error editing PDF:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


// Function to add text to an image
const addTextToImage = async (filePath, outputPath, textFields) => {
  const { logoText, nameText, addressText } = textFields;

  // Create an SVG overlay with dynamic text fields
  const textOverlay = Buffer.from(
    `<svg width="800" height="400">
      <!-- Logo at top-left -->
      <text x="250" y="350" font-size="30" fill="black">Logo: ${logoText}</text>
      
      <!-- Name at center -->
      <text x="400" y="400" font-size="30" fill="black" text-anchor="middle">Name: ${nameText}</text>
      
      <!-- Address at bottom-left -->
      <text x="500" y="400" font-size="30" fill="black">Address: ${addressText}</text>
    </svg>`
  );

  // Use sharp to apply the text overlay to the image
  await sharp(filePath)
    .composite([{ input: textOverlay, gravity: "northwest" }])
    .toFile(outputPath);
};

const uploadFile = async (req, res) => {
  try {
    const { nameText, month, contactNumber, year, templateUrl, hindiText } = req.body; // Get form data, including dynamic Hindi text
    const logoImage = req.files?.logoImage ? req.files.logoImage[0] : null; // Optional logo image
    const { productId } = req.params; // Get productId from the request parameters

    if (!templateUrl) {
      return res.status(400).json({ error: "No template image URL provided" });
    }

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Find the existing product by productId
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Ensure the template URL is valid
    const template = product.templates.find(t => t.url === templateUrl);
    if (!template) {
      return res.status(404).json({ error: "Template URL not found in product" });
    }

    const transformations = [];

    // Apply nameText with bold red style at the top (Handle Hindi Text)
    if (nameText) {
      transformations.push({
        overlay: {
          text: nameText,
          font_family: "Arial", // Ensure font supports Hindi characters
          font_size: 60,
          font_weight: "bold", // Bold font
        },
        color: "red", // Red color
        gravity: "north", // Position text at the top
        y: 70, // Adjust the vertical position
      });
    }

    // Apply text overlays for other fields dynamically with line breaks and multiple parts
    const overlayFields = [
      { text: contactNumber, y: 130 },
      { text: month, y: 180 },
      { text: year, y: 230 },
    ];

    overlayFields.forEach(field => {
      if (field.text) {
        transformations.push({
          overlay: {
            text: field.text, // Directly pass text here
            font_family: "Arial",
            font_size: 40,
          },
          color: "black", // Text color
          gravity: "south", // Position text at the bottom
          y: field.y, // Dynamic vertical offset
        });
      }
    });

    // Handling longer Hindi text with line breaks dynamically (now dynamic from req.body)
    const splitText = (text, lineHeight) => {
      const lines = [];
      const words = text.split(" "); // Split text into words

      let line = "";
      words.forEach((word, index) => {
        if (line.length + word.length > 30) {
          lines.push(line); // Push current line
          line = word; // Start new line
        } else {
          line += (line ? " " : "") + word;
        }

        // If it's the last word, push the remaining line
        if (index === words.length - 1) lines.push(line);
      });

      return lines;
    };

    // Decode hindiText (if it's URL-encoded)
    if (hindiText) {
      const decodedHindiText = decodeURIComponent(hindiText); // Decode the URL-encoded Hindi text
      const lines = splitText(decodedHindiText, 60); // Adjust line length based on requirements

      // Add Hindi text to transformations with color changes
      lines.forEach((line, index) => {
        transformations.push({
          overlay: {
            text: line,
            font_family: "Arial", // Ensure font supports Hindi characters
            font_size: 50,
          },
          color: index === 0 ? "black" : "red", // First line black, subsequent red
          gravity: "north",
          y: 280 + (index * 60), // Adjust vertical spacing between lines
        });
      });
    }

    // Apply logo overlay if logo image is uploaded (Optional)
    if (logoImage) {
      const logoResponse = await cloudinary.uploader.upload(logoImage.path, {
        upload_preset: 'custom',
      });

      transformations.push({
        overlay: {
          public_id: logoResponse.public_id, // Logo public_id for overlay
          width: 200,
          height: 100,
        },
        gravity: "north", // Position logo at the top
        y: 10,
      });
    }

    // Log before applying transformations
    console.log("Applying Transformations:", transformations);

    // Apply transformations directly using Cloudinary's upload API
    const finalImageResponse = await cloudinary.uploader.upload(templateUrl, {
      upload_preset: 'custom',
      transformation: transformations, // Apply transformations directly
    });

    // Log the final image response to check if the text overlay is applied
    console.log("Final Image Response:", finalImageResponse);

    // If transformations are applied, we should see changes in the URL
    if (!finalImageResponse || !finalImageResponse.secure_url) {
      return res.status(500).json({
        success: false,
        message: "Transformation failed. No transformed image returned.",
      });
    }

    // Add the transformed template image URL to the templatesImages[] array
    product.templatesImages.push({
      imageUrl: finalImageResponse.secure_url, // Store the transformed image URL
    });

    await product.save(); // Save the updated product with the new template image

    // Return success response with the updated image URL only
    res.status(201).json({
      success: true,
      message: "Product Updated Successfully with Image Overlay",
      imageUrl: finalImageResponse.secure_url, // Send only the transformed image URL
    });
  } catch (error) {
    console.error("Error in updating product with image overlay:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error in updating product with image overlay",
    });
  }
};










// Upload a new template to Cloudinary and associate it with a product
const uploadTemplate = async (req, res) => {
  try {
    const { id } = req.params; // Extract productId from request parameters
    const file = req.file; // Uploaded file

    if (!id) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Upload the template to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(file.path, {
      upload_preset: 'custom', // Your Cloudinary upload preset
      folder: 'templates', // Optional: store in a specific folder
    });

    // Save the template details
    const newTemplate = {
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
      isTemplate: true, // Mark as a template
    };

    // Find the product by ID and update its templates array
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.templates = product.templates || []; // Ensure templates array exists
    product.templates.push(newTemplate); // Add the new template

    await product.save(); // Save the updated product

    res.status(201).json({
      success: true,
      message: 'Template uploaded and associated with the product successfully!',
      template: newTemplate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error uploading template',
      error: error.message,
    });
  }
};




// Get the absolute path of the file
const getAbsoluteFilePath = (filePath) => {
  // Assuming 'uploads' directory is in the root of your project
  return path.resolve(filePath);
};

// Check if the file exists using fs.promises.access
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath); // Check if file is accessible
    return true; // File exists
  } catch (error) {
    return false; // File does not exist
  }
};

// Function to generate the image with new text
const addTextToImageUpdate = async (filePath, outputPath, { logoText, nameText, addressText }) => {
  // Create an SVG overlay for text positions
  const textOverlay = Buffer.from(
    `<svg width="800" height="400">
      <text x="10" y="50" font-size="30" fill="black">${logoText}</text>
      <text x="10" y="100" font-size="30" fill="black">${nameText}</text>
      <text x="10" y="150" font-size="30" fill="black">${addressText}</text>
    </svg>`
  );

  // Use sharp to apply the text overlay to the image
  await sharp(filePath)
    .composite([{ input: textOverlay, gravity: "northwest" }])
    .toFile(outputPath);
};

// Update the text fields and regenerate the image
const updateTextFields = async (req, res) => {
  const { logoText, nameText, addressText } = req.body;
  const { id } = req.params;  // Getting the image ID from the URL

  try {
    // Update the text fields in the database using findByIdAndUpdate
    const updatedImage = await Image.findByIdAndUpdate(
      id,
      {
        logoText: logoText || undefined,  // Only update if value is provided
        nameText: nameText || undefined,  // Only update if value is provided
        addressText: addressText || undefined,  // Only update if value is provided
      },
      { new: true } // This will return the updated image after the operation
    );

    if (!updatedImage) {
      return res.status(404).json({ error: "Image not found" });
    }

    // You can also regenerate the image if needed using sharp, like this:
    // await addTextToImage(updatedImage.filePath, updatedOutputPath, {
    //   logoText: updatedImage.logoText,
    //   nameText: updatedImage.nameText,
    //   addressText: updatedImage.addressText,
    // });

    // Return the updated image data in the response (for simplicity, we are just returning the updated image)
    return res.json(updatedImage);

  } catch (error) {
    console.error("Error updating text fields:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Controller to fetch and serve the image
const getImage = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the image by ID from the database, selecting only the 'filePath' field
    const image = await Image.findById(id).select('filePath');

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Send the image file to the client
    res.sendFile(image.filePath, { root: '.' }); // Assuming the 'filePath' is relative to the project root

  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTemplates = async (req, res) => {
  try {
    const { id } = req.params; // Extract productId from request parameters

    if (id) {
      // Fetch templates associated with a specific product
      const product = await Product.findById(id).select('templates');
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      if (!product.templates || product.templates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No templates found for this product',
        });
      }

      // Return the templates associated with the product
      return res.status(200).json({
        success: true,
        message: 'Templates fetched successfully',
        templates: product.templates,
      });
    } else {
      // Fetch all templates (from both Image collection and products)
      const imageTemplates = await Image.find({ isTemplate: true });
      const productTemplates = await Product.aggregate([
        {
          $match: { 'templates': { $exists: true, $not: { $size: 0 } } }, // Ensure templates array exists and is not empty
        },
        {
          $project: {
            templates: 1, // Only return templates
          },
        },
      ]);

      // Combine both sources of templates
      const allTemplates = [
        ...imageTemplates,
        ...productTemplates.flatMap(product => product.templates),
      ];

      if (allTemplates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No templates found',
        });
      }

      // Return all templates
      return res.status(200).json({
        success: true,
        message: 'Templates fetched successfully',
        templates: allTemplates,
      });
    }
  } catch (error) {
    console.error('Error fetching templates:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch templates',
    });
  }
};


module.exports = {
  addProduct,
  addAllProducts,
  getAllProducts,
  getShowingProducts,
  getDiscountedProducts,
  getStockOutProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  updateStatus,
  deleteProduct,
  getSimilarProducts,
  searchProducts,
  getAllProductsByCategory,
  getAllProductsByCategoryFliers,
  getAllProductsByCategorySchool,
  getAllProductsByCategoryCanvas,
  getAllProductsByCategoryAcrylic,
  getAllProductsByCategoryBanks,
  getAllProductsByCategoryBillBooks,
  getAllProductsByCategoryCards,
  uploadDesign,
  getAllProductsBySearh,
  submitRating,
  getProductRatings,
  generateInvitation,
  updateInvitation,
  editPdfAndUploadToProduct,
  uploadFile,
  updateTextFields,
  getImage,
  uploadTemplate,
  getTemplates
};