const mongoose = require('mongoose');

const AlbumSchema = new mongoose.Schema({
  catId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  title:  { type: String, required: true },
  desc:   { type: String, default: '' },
  images: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Album', AlbumSchema);
