import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["mcq", "short"], required: true },
    text: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    marks: { type: Number, default: 1 },
  },
  { _id: true },
);

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    duration: { type: Number, required: true },
    startTime: { type: Date },
    endTime: { type: Date },
    shuffleQuestions: { type: Boolean, default: false },
    maxViolationsAllowed: { type: Number, default: 8 },
    passMarks: { type: Number, default: 0 },
    questions: [questionSchema],
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    targetBatches: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true },
);

export default mongoose.model("Test", testSchema);
