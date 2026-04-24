const express = require("express");
const router = express.Router();
const {
  getSegments,
  createSegment,
} = require("../controllers/segmentController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.get("/", auth, getSegments);
router.post("/", auth, role("officer", "manager"), createSegment);

module.exports = router;

