const mongoose = require('mongoose');

const StatsSchema = new mongoose.Schema({
  visitors: { type: Number, default: 5507184 },
  activeCadets: { type: Number, default: 221464 },
  registeredCadets: { type: Number, default: 365094 }
}, { timestamps: true });

module.exports = mongoose.model('Stats', StatsSchema);
