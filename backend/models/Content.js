const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  heroImage: { type: String, default: '' },
  nccLogo:   { type: String, default: '' },
  thaparLogo:{ type: String, default: '' },
  backLink:  { type: String, default: 'https://www.thapar.edu/students' },
  aimTitle:  { type: String, default: 'Aim Of the NCC Digital Forum' },
  aimDesc1:  { type: String, default: '' },
  aimDesc2:  { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Content', ContentSchema);
