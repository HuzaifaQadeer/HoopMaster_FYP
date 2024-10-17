const mongoose = require('mongoose');

const verificationcodeSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  code: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('VerficationCode', verificationcodeSchema);