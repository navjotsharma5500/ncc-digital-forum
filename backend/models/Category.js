const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name:  { type: String, required: true },
  cover: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
