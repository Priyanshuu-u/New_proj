import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    response: { type: String, default: "" },
    marksAwarded: { type: Number, default: 0 },
  },
  { _id: false },
);

const violationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    snapshot: { type: String, default: "" },
    severity: { type: String, enum: ["low", "medium", "high"], default: "low" },
  },
  { _id: false },
);

const examSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: ["active", "submitted", "auto-submitted", "terminated"],
      default: "active",
    },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    suspicionScore: { type: Number, default: 0 },
    violations: [violationSchema],
  },
  { timestamps: true },
);

examSessionSchema.index({ student: 1, test: 1 }, { unique: true });

export default mongoose.model("ExamSession", examSessionSchema);
