const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Task = require("./models/task");

dotenv.config();

const countKDMP = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ DB Connected");

    const count = await Task.countDocuments({ segment: "KDMP" });
    console.log(`📊 Jumlah Total Task KDMP: ${count}`);
    
    // Cek sample 5 data pertama
    const samples = await Task.find({ segment: "KDMP" }).limit(5);
    console.log("\nSample 5 Task KDMP:");
    samples.forEach(t => console.log(`- ${t.title}: ${t.description} (Lat: ${t.latitude}, Lon: ${t.longitude})`));

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

countKDMP();
