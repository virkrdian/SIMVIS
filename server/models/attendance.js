const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  clockIn: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      accuracy: Number
    },
    photo: String // URL to photo if needed later
  },
  clockOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      accuracy: Number
    },
    photo: String
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent', 'permit'],
    default: 'present'
  }
}, { timestamps: true });

// Compound index to ensure one attendance record per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
