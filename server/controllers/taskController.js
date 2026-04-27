const Task = require("../models/task");
const User = require("../models/user");

// GET ALL TASKS
exports.getTasks = async (req, res) => {
  try {
    const { status, segment } = req.query;
    const filter = {};

    if (req.user?.role === "ar" || req.user?.role === "sales") {
      const requester = await User.findById(req.user.id).select("email");
      const requesterEmail = String(requester?.email || "").toLowerCase();
      const canAccessAllTasks = requesterEmail === "ar@demo.com";
      if (!canAccessAllTasks) {
        filter.$or = [
          { assignedTo: req.user.id },
          { assignedTo: { $exists: false } },
          { assignedTo: null }
        ];
      }
    }

    // Apply status filter if provided and not 'all'
    if (status && status !== "all") {
      filter.status = status;
    }

    // Apply segment filter if provided and not 'all'
    if (segment && segment !== "all") {
      filter.segment = segment;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email role employeeId agentCode")
      .populate("completedBy", "name email role employeeId agentCode")
      .populate("comments.userId", "name role") // Populate comment user
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD BULK TASKS (Import CSV)
exports.addBulkTasks = async (req, res) => {
  try {
    const tasksData = req.body; // Expect array of task objects
    if (!Array.isArray(tasksData)) {
      return res.status(400).json({ message: "Data harus berupa array" });
    }

    const tasksToInsert = tasksData.map((t) => ({
      title: t.title || "Untitled Task",
      description: t.description || "",
      location: t.location || "",
      reward: t.reward || 0,
      latitude: t.latitude || 0,
      longitude: t.longitude || 0,
      segment: String(t.segment || "").trim(),
      status: "pending",
      deadline: t.deadline ? new Date(t.deadline) : undefined,
      priority: t.priority || "medium",
    }));

    if (tasksToInsert.length === 0) {
      return res
        .status(400)
        .json({ message: "Tidak ada data valid untuk diimport" });
    }

    const result = await Task.insertMany(tasksToInsert);
    res.json({
      message: `Berhasil mengimport ${result.length} tasks`,
      count: result.length,
    });
  } catch (err) {
    console.error("Bulk add task error:", err);
    res.status(500).json({ message: "Server error saat import" });
  }
};

// ADD TASK (Officer)
exports.addTask = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      reward,
      latitude,
      longitude,
      segment,
      assignedTo,
      deadline,
      priority,
    } = req.body;

    if (!title || !description || !location || reward === undefined || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Field wajib (title, description, location, reward, latitude, longitude) tidak boleh kosong" });
    }

    if (assignedTo) {
      const user = await User.findById(assignedTo).select("_id role");
      if (!user) {
        return res.status(400).json({ message: "User AR/SA tidak ditemukan" });
      }
      if (user.role !== "ar" && user.role !== "sales") {
        return res
          .status(400)
          .json({ message: "assignedTo harus role AR atau Sales" });
      }
    }

    const task = new Task({
      title,
      description,
      location,
      reward,
      latitude,
      longitude,
      segment: String(segment || "").trim(),
      status: "pending",
      assignedTo: assignedTo || undefined,
      deadline: deadline || undefined,
      priority: priority || "medium",
      history: [
        {
          action: "created",
          details: "Task created",
          performedBy: req.user.id,
        },
      ],
    });

    await task.save();
    res.json({ message: "Task berhasil ditambahkan", task });
  } catch (err) {
    console.error("Add task error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// COMPLETE TASK (AR)
exports.completeTask = async (req, res) => {
  try {
    const { reportType, reportData, picName, picPhone, notes, prospects } =
      req.body;
    const files = req.files || {};
    const buildEvidenceFile = (file) => {
      if (!file || !file.buffer) return null;
      return {
        data: file.buffer,
        contentType: file.mimetype,
        filename: file.originalname,
        size: file.size,
        uploadedAt: new Date(),
      };
    };
    const evidenceFrontFile = buildEvidenceFile(files.evidenceFront?.[0]);
    const evidenceSideFile = buildEvidenceFile(files.evidenceSide?.[0]);
    const evidenceWithPicFile = buildEvidenceFile(files.evidenceWithPic?.[0]);
    const evidenceFile =
      buildEvidenceFile(files.evidence?.[0]) ||
      evidenceFrontFile ||
      evidenceSideFile ||
      evidenceWithPicFile ||
      null;

    let parsedReportData = {};
    if (reportData) {
      try {
        parsedReportData = typeof reportData === "string" ? JSON.parse(reportData) : reportData;
      } catch (e) {
        console.error("Error parsing reportData:", e);
        parsedReportData = { raw: reportData };
      }
    }

    const existing = await Task.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Task not found" });

    const update = {
      status: "done",
      reportType,
      reportData: parsedReportData,
      evidence: null,
      evidenceFront: null,
      evidenceSide: null,
      evidenceWithPic: null,
      evidenceFile,
      evidenceFrontFile,
      evidenceSideFile,
      evidenceWithPicFile,
      picName,
      picPhone,
      notes,
      prospects: prospects ? parseInt(prospects) : 0,
      completedBy: req.user?.id,
      completedAt: new Date(),
    };
    if (existing && !existing.assignedTo && req.user?.id) {
      update.assignedTo = req.user.id;
    }

    // Push history
    const historyEntry = {
      action: "status_change",
      details: "Task completed",
      performedBy: req.user.id,
    };

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $set: update,
        $push: { history: historyEntry },
      },
      { new: true }
    )
      .populate("assignedTo", "name email role employeeId agentCode")
      .populate("completedBy", "name email role employeeId agentCode")
      .populate("comments.userId", "name role");

    res.json(task);
  } catch (err) {
    console.error("Complete task error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getEvidenceFile = async (req, res) => {
  try {
    const id = req.params.id;
    const field = String(req.params.field || "").trim();
    const map = {
      evidence: "evidenceFile",
      evidenceFront: "evidenceFrontFile",
      evidenceSide: "evidenceSideFile",
      evidenceWithPic: "evidenceWithPicFile",
    };
    const mapped = map[field];
    if (!mapped) {
      return res.status(400).json({ message: "Field bukti tidak valid" });
    }

    const task = await Task.findById(id).select(
      [
        "assignedTo",
        "completedBy",
        `${mapped}.contentType`,
        `${mapped}.filename`,
        `${mapped}.size`,
        `${mapped}.uploadedAt`,
        `+${mapped}.data`,
      ].join(" ")
    );
    if (!task) return res.status(404).json({ message: "Task tidak ditemukan" });

    const role = String(req.user?.role || "");
    const userId = String(req.user?.id || "");
    const canAccess =
      role === "manager" ||
      role === "officer" ||
      String(task.assignedTo || "") === userId ||
      String(task.completedBy || "") === userId;
    if (!canAccess) return res.status(403).json({ message: "Akses ditolak" });

    const file = task[mapped];
    if (!file || !file.data) {
      return res.status(404).json({ message: "File bukti tidak ditemukan" });
    }

    res.setHeader("Content-Type", file.contentType || "application/octet-stream");
    const safeName = String(file.filename || `${field}.bin`).replace(/[\r\n"]/g, "_");
    res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
    res.send(file.data);
  } catch (err) {
    console.error("Get evidence file error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PROGRESS TASK
exports.progressTask = async (req, res) => {
  try {
    const existing = await Task.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Task not found" });

    const update = { status: "progress" };
    if (existing && !existing.assignedTo && req.user?.id) {
      update.assignedTo = req.user.id;
    }

    const historyEntry = {
      action: "status_change",
      details: "Task started (in progress)",
      performedBy: req.user.id,
    };

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $set: update,
        $push: { history: historyEntry },
      },
      { new: true }
    )
      .populate("assignedTo", "name email role employeeId agentCode")
      .populate("completedBy", "name email role employeeId agentCode")
      .populate("comments.userId", "name role");

    res.json(task);
  } catch (err) {
    console.error("Progress task error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD COMMENT
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ message: "Comment text required" });

    const user = await User.findById(req.user.id);
    const comment = {
      userId: user._id,
      userName: user.name,
      text,
    };

    const historyEntry = {
      action: "comment",
      details: "Added a comment",
      performedBy: req.user.id,
    };

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $push: { comments: comment, history: historyEntry },
      },
      { new: true }
    )
      .populate("assignedTo", "name email role employeeId agentCode")
      .populate("completedBy", "name email role employeeId agentCode")
      .populate("comments.userId", "name role");

    res.json(task);
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
