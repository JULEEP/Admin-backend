const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  parent: {
    type: String,
  },
  slug: {
    type: String,
  },
  type: {
    type: String,
  },
  icon: {
    type: String,
  },
  children: [{}],
  status: {
    type: String,
    enum: ['Show', 'Hide'],
    default: 'Show',
  },
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
