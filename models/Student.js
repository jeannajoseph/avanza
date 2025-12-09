const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }
  // Add password or other info here if needed
});

module.exports = mongoose.model('Student', studentSchema);
