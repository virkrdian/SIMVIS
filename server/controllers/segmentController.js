const Segment = require("../models/segment");

const DEFAULT_SEGMENTS = ["Sekolah", "KDMP", "Bisnis", "SPPG", "Goverment"];

exports.getSegments = async (req, res) => {
  try {
    const segments = await Segment.find().sort({ name: 1 });
    if (segments.length > 0) return res.json(segments);

    const inserted = await Segment.insertMany(
      DEFAULT_SEGMENTS.map((name) => ({ name })),
      { ordered: false }
    ).catch(() => null);

    const after = await Segment.find().sort({ name: 1 });
    if (inserted) return res.json(after);
    return res.json(after);
  } catch (err) {
    console.error("Get segments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createSegment = async (req, res) => {
  try {
    const { name } = req.body || {};
    const normalized = String(name || "").trim();
    if (!normalized)
      return res.status(400).json({ message: "Nama segment wajib diisi" });

    const existing = await Segment.findOne({
      name: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });
    if (existing) return res.json(existing);

    const created = await Segment.create({ name: normalized });
    res.json(created);
  } catch (err) {
    if (err && err.code === 11000) {
      const existing = await Segment.findOne({
        name: new RegExp(
          `^${String(req.body?.name || "")
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      });
      if (existing) return res.json(existing);
    }
    console.error("Create segment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

