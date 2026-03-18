const mongoose = require('mongoose');

const ArchiveSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  desc:    { type: String, default: '' },
  image:   { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Archive', ArchiveSchema);
