import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["examiner", "student"],
      default: "student",
    },
    batch: { type: String, default: "", trim: true, lowercase: true },
    institution: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
