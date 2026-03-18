const mongoose = require('mongoose');

const AlumniSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  desc:  { type: String, default: '' },
  image: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Alumni', AlumniSchema);
