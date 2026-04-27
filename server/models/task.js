const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const historySchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g., "status_change", "update", "comment"
    details: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    reward: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "progress", "done"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    deadline: { type: Date },
    segment: { type: String, default: "" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date },
    reportType: { type: String },
    reportData: { type: Object },
    evidence: { type: String },
    evidenceFront: { type: String },
    evidenceSide: { type: String },
    evidenceWithPic: { type: String },
    evidenceFile: {
      data: { type: Buffer, select: false },
      contentType: { type: String },
      filename: { type: String },
      size: { type: Number },
      uploadedAt: { type: Date },
    },
    evidenceFrontFile: {
      data: { type: Buffer, select: false },
      contentType: { type: String },
      filename: { type: String },
      size: { type: Number },
      uploadedAt: { type: Date },
    },
    evidenceSideFile: {
      data: { type: Buffer, select: false },
      contentType: { type: String },
      filename: { type: String },
      size: { type: Number },
      uploadedAt: { type: Date },
    },
    evidenceWithPicFile: {
      data: { type: Buffer, select: false },
      contentType: { type: String },
      filename: { type: String },
      size: { type: Number },
      uploadedAt: { type: Date },
    },
    // New fields for AR reporting
    picName: { type: String },
    picPhone: { type: String },
    notes: { type: String },
    prospects: { type: Number, default: 0 },
    comments: [commentSchema],
    history: [historySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
