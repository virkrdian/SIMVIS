const express = require("express");
const router = express.Router();
const {
  login,
  register,
  createUser,
  getAllUsers,
  deleteUser,
  updateProfile,
  getProfile,
} = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// LOGIN
router.post("/login", login);

// REGISTER (Public)
router.post("/register", register);

// OFFICER: tambah AR & Sales
router.post("/create", auth, role("officer", "manager"), createUser);

// MANAGER: tambah Officer
router.post("/create-officer", auth, role("manager"), createUser);

// MANAGER: lihat semua user
router.get("/all", auth, role("manager", "officer"), getAllUsers);

// MANAGER: hapus user
router.delete("/delete/:id", auth, role("manager"), deleteUser);

// PROFILE (All authenticated users)
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);

module.exports = router;
