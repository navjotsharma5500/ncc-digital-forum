const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  email:  { type: String, required: true },
  phone:  { type: String, default: '' },
  course: { type: String, default: '' },
  year:   { type: String, default: '' },
  date:   { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Registration', RegistrationSchema);
