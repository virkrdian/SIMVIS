const Attendance = require('../models/attendance');

// Helper to get current date string YYYY-MM-DD
const getDateString = () => {
  return new Date().toISOString().split('T')[0];
};

exports.getTodayStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Sesi tidak valid, silakan login ulang" });
    }
    const today = getDateString();
    const attendance = await Attendance.findOne({
      user: req.user.id,
      date: today
    });
    
    if (!attendance) {
      return res.json({ status: 'not-started', data: null });
    }
    
    if (attendance.clockIn && !attendance.clockOut) {
      return res.json({ status: 'clocked-in', data: attendance });
    }
    
    if (attendance.clockIn && attendance.clockOut) {
      return res.json({ status: 'clocked-out', data: attendance });
    }
    
    res.json({ status: 'unknown', data: attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.clockIn = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Koordinat lokasi wajib disertakan" });
    }

    const today = getDateString();
    
    // Check if already clocked in
    let attendance = await Attendance.findOne({ user: req.user.id, date: today });
    if (attendance) {
      return res.status(400).json({ message: 'Anda sudah absen masuk hari ini' });
    }
    
    attendance = new Attendance({
      user: req.user.id,
      date: today,
      clockIn: {
        time: new Date(),
        location: { latitude, longitude, address }
      }
    });
    
    await attendance.save();
    res.json({ message: 'Berhasil Clock In', data: attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.clockOut = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Koordinat lokasi wajib disertakan" });
    }

    const today = getDateString();
    
    const attendance = await Attendance.findOne({ user: req.user.id, date: today });
    
    if (!attendance) {
      return res.status(400).json({ message: 'Anda belum absen masuk hari ini' });
    }
    
    if (attendance.clockOut && attendance.clockOut.time) {
      return res.status(400).json({ message: 'Anda sudah absen pulang hari ini' });
    }
    
    attendance.clockOut = {
      time: new Date(),
      location: { latitude, longitude, address }
    };
    
    await attendance.save();
    res.json({ message: 'Berhasil Clock Out', data: attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await Attendance.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(30);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
