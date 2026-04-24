const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validateEmail, validatePassword } = require("../utils/validators");

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email dan password wajib diisi" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Format email tidak valid" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User tidak ditemukan" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Password salah" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, role: user.role, name: user.name, email: user.email });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// REGISTER (Public)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, employeeId, agentCode } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Format email tidak valid" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Password minimal 6 karakter" });
    }

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email sudah terdaftar" });

    // Validasi field khusus role
    if (role === "officer" || role === "manager") {
      if (!employeeId)
        return res
          .status(400)
          .json({ message: "NIP wajib diisi untuk Officer/Manager" });
    } else if (role === "ar" || role === "sales") {
      if (!agentCode)
        return res
          .status(400)
          .json({ message: "Kode AR/SA wajib diisi untuk AR/Sales" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashed,
      role,
      employeeId,
      agentCode,
    });

    await user.save();
    res.json({ message: "Registrasi berhasil", user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// CREATE USER (Officer & Manager)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, employeeId, agentCode } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Format email tidak valid" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Password minimal 6 karakter" });
    }

    const requestedRole = String(role || "")
      .trim()
      .toLowerCase();

    if (!requestedRole) {
      return res.status(400).json({ message: "Role wajib diisi" });
    }

    if (req.user?.role === "officer") {
      const allowedRoles = new Set(["ar", "sales", "officer"]);
      if (!allowedRoles.has(requestedRole)) {
        return res
          .status(403)
          .json({
            message: "Officer hanya bisa menambahkan akun AR, Sales, dan Officer",
          });
      }
    }

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email sudah terdaftar" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashed,
      role: requestedRole,
      employeeId,
      agentCode,
    });

    await user.save();
    res.json({ message: "User berhasil dibuat", user });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL USERS (Manager)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE USER (Manager)
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE PROFILE (Self)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const update = {};

    if (name) update.name = name;
    if (email) {
      // Check if email taken
      const exists = await User.findOne({ email });
      if (exists && exists._id.toString() !== req.user.id) {
        return res
          .status(400)
          .json({ message: "Email sudah digunakan user lain" });
      }
      update.email = email;
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      update.password = hashed;
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
    }).select("-password");

    res.json({ message: "Profil berhasil diupdate", user });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET PROFILE (Self)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
