const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const normalizeMongoUri = (uri, dbName) => {
  if (!uri || !dbName) return uri;

  const hasDbPath = /mongodb(?:\+srv)?:\/\/[^/]+\/[^?]+/.test(uri);
  if (hasDbPath) return uri;

  if (/mongodb(?:\+srv)?:\/\/[^/]+\/\?/.test(uri)) {
    return uri.replace(/\/\?/, `/${dbName}?`);
  }

  if (/mongodb(?:\+srv)?:\/\/[^/]+\/$/.test(uri)) {
    return uri.replace(/\/$/, `/${dbName}`);
  }

  if (/mongodb(?:\+srv)?:\/\/[^/]+$/.test(uri)) {
    return `${uri}/${dbName}`;
  }

  return uri;
};

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) return;

    const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!rawUri) {
      throw new Error("Missing MongoDB URI. Set MONGO_URI (or MONGODB_URI).");
    }

    const dbName = process.env.DB_NAME || "simvis";
    const mongoUri = normalizeMongoUri(rawUri, dbName);

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
