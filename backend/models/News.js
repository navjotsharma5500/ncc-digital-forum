const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc:  { type: String, default: '' },
  date:  { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('News', NewsSchema);
