const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Task = require("./models/task");

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Task.deleteMany({});

    await Task.insertMany([
      {
        title: "Visit Client A - Thamrin",
        description: "Kunjungi client untuk presentasi produk",
        location: "Thamrin, Jakarta",
        reward: 50000,
        status: "done",
        latitude: -6.186486,
        longitude: 106.822745,
      },
      {
        title: "Survey Area - Kelapa Gading",
        description: "Survey area untuk ekspansi bisnis",
        location: "Kelapa Gading",
        reward: 75000,
        status: "progress",
        latitude: -6.1598,
        longitude: 106.9133,
      },
      {
        title: "Client Meeting - Senayan",
        description: "Meeting dengan client potensial",
        location: "Senayan",
        reward: 60000,
        status: "pending",
        latitude: -6.2276,
        longitude: 106.8078,
      },
    ]);

    console.log("✅ Task demo berhasil di-seed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
