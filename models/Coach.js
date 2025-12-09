const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // e.g. "10:00 AM"
  endTime: { type: String, required: true },
  isBooked: { type: Boolean, default: false }
});

const coachSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  expertise: [String],
  availability: [availabilitySlotSchema]
});

module.exports = mongoose.model('Coach', coachSchema);
