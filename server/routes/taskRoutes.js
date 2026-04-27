const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
  getTasks,
  addTask,
  addBulkTasks,
  completeTask,
  getEvidenceFile,
  progressTask,
  addComment,
} = require("../controllers/taskController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const authFromHeaderOrQuery = (req, res, next) => {
  const header = req.headers.authorization;
  const queryToken = req.query?.token;
  const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : queryToken;
  if (!token) return res.status(401).json({ message: "Token tidak ada" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token tidak valid" });
  }
};

// GET ALL TASKS
router.get("/", auth, getTasks);

// OFFICER: tambah task
router.post("/add", auth, role("officer"), addTask);

// OFFICER/MANAGER: import bulk tasks
router.post("/import", auth, role("officer", "manager"), addBulkTasks);

// AR: complete task
router.put(
  "/:id/complete",
  auth,
  role("ar", "sales"),
  upload.fields([
    { name: "evidenceFront", maxCount: 1 },
    { name: "evidenceSide", maxCount: 1 },
    { name: "evidenceWithPic", maxCount: 1 },
    { name: "evidence", maxCount: 1 },
  ]),
  completeTask
);

router.get("/:id/evidence/:field", authFromHeaderOrQuery, getEvidenceFile);

// AR: progress task
router.put("/:id/progress", auth, role("ar", "sales"), progressTask);

// ALL: add comment
router.post("/:id/comment", auth, addComment);

module.exports = router;
