const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const availabilitySchema = new mongoose.Schema({
  date: Date,
  startTime: String,
  endTime: String,
  isBooked: { type: Boolean, default: false },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ['student', 'coach'], required: true },

  expertise: [String], // coach-only
  availability: [availabilitySchema], // coach-only
  enrolledCoachIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // student-only

  // add this 👇
  googleTokens: {
    access_token: String,
    refresh_token: String,
    scope: String,
    expiry_date: Number
  }
});

userSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
