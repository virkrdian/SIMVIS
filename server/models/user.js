const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["ar", "sales", "officer", "manager"],
      required: true,
    },
    employeeId: { type: String }, // NIP untuk Officer & Manager
    agentCode: { type: String }, // Kode AR/SA untuk AR & Sales
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
