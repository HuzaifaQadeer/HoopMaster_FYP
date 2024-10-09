const mongoose = require('mongoose');

const drillSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  // Add other drill fields as needed
}, { timestamps: true });

module.exports = mongoose.model('Drill', drillSchema);