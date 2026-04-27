const Attendance = require('../models/attendance');
const { reverseGeocode } = require("../utils/geocode");

// Helper to get current date string YYYY-MM-DD
const getDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const toNumber = (v) => {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
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
    const { latitude, longitude, address, accuracy } = req.body;
    const lat = toNumber(latitude);
    const lon = toNumber(longitude);
    const acc = toNumber(accuracy);

    if (lat === null || lon === null) {
      return res.status(400).json({ message: "Koordinat lokasi wajib disertakan" });
    }

    const today = getDateString();
    
    // Check if already clocked in
    let attendance = await Attendance.findOne({ user: req.user.id, date: today });
    if (attendance) {
      return res.status(400).json({ message: 'Anda sudah absen masuk hari ini' });
    }
    
    let resolvedAddress = String(address || "").trim();
    const isPlaceholder =
      !resolvedAddress ||
      resolvedAddress.toLowerCase().startsWith("lat:") ||
      resolvedAddress.toLowerCase().includes("(gps)");
    if (isPlaceholder) {
      const lookedUp = await reverseGeocode(lat, lon).catch(() => null);
      if (lookedUp) resolvedAddress = lookedUp;
    }

    attendance = new Attendance({
      user: req.user.id,
      date: today,
      clockIn: {
        time: new Date(),
        location: { latitude: lat, longitude: lon, address: resolvedAddress, accuracy: acc }
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
    const { latitude, longitude, address, accuracy } = req.body;
    const lat = toNumber(latitude);
    const lon = toNumber(longitude);
    const acc = toNumber(accuracy);

    if (lat === null || lon === null) {
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
    
    let resolvedAddress = String(address || "").trim();
    const isPlaceholder =
      !resolvedAddress ||
      resolvedAddress.toLowerCase().startsWith("lat:") ||
      resolvedAddress.toLowerCase().includes("(gps)");
    if (isPlaceholder) {
      const lookedUp = await reverseGeocode(lat, lon).catch(() => null);
      if (lookedUp) resolvedAddress = lookedUp;
    }

    attendance.clockOut = {
      time: new Date(),
      location: { latitude: lat, longitude: lon, address: resolvedAddress, accuracy: acc }
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

exports.getAllToday = async (req, res) => {
  try {
    const today = getDateString();
    const list = await Attendance.find({ date: today })
      .populate("user", "name email role employeeId agentCode")
      .sort({ "clockIn.time": -1, createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
