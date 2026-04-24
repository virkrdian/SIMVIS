const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/user");
require("dotenv").config();

const users = [
  {
    name: "Manager Demo",
    email: "manager@demo.com",
    password: "123456", // akan di-hash
    role: "manager",
    employeeId: "MGR001",
  },
  {
    name: "Officer Demo",
    email: "officer@demo.com",
    password: "123456",
    role: "officer",
    employeeId: "OFF001",
  },
  {
    name: "AR Demo",
    email: "ar@demo.com",
    password: "123456",
    role: "ar",
    agentCode: "AR001",
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        const hashed = await bcrypt.hash(u.password, 10);
        await User.create({ ...u, password: hashed });
        console.log(`Created user: ${u.email}`);
      } else {
        console.log(`User already exists: ${u.email}`);
      }
    }

    console.log("Seeding complete");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
