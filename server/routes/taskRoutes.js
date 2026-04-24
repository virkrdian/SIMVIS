const express = require("express");
const router = express.Router();
const {
  getTasks,
  addTask,
  addBulkTasks,
  completeTask,
  progressTask,
  addComment,
} = require("../controllers/taskController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

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

// AR: progress task
router.put("/:id/progress", auth, role("ar", "sales"), progressTask);

// ALL: add comment
router.post("/:id/comment", auth, addComment);

module.exports = router;
