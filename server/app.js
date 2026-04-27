const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

let dbInitialized = false;
const ensureDb = async () => {
  if (dbInitialized) return;
  await connectDB();
  dbInitialized = true;
};

app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (e) {
    next(e);
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/segments", require("./routes/segmentRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));

const { errorHandler } = require("./utils/error");
app.use(errorHandler);

module.exports = app;

