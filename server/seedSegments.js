const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Segment = require("./models/segment");

dotenv.config();

const seedSegments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ DB Connected");

    const segmentName = "KDMP";
    
    // Cek apakah segment KDMP sudah ada
    const exists = await Segment.findOne({ name: segmentName });
    
    if (exists) {
        console.log(`⚠️ Segment '${segmentName}' sudah ada.`);
    } else {
        await Segment.create({ name: segmentName });
        console.log(`✅ Berhasil menambahkan segment: '${segmentName}'`);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

seedSegments();
