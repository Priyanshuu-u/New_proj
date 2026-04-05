import mongoose from "mongoose";

export function errorHandler(err, _req, res, _next) {
  const message = err?.message || "Internal server error";

  if (err?.name === "ValidationError") {
    return res.status(400).json({ message });
  }

  if (
    err?.name === "MongoServerSelectionError" ||
    err instanceof mongoose.Error.MongooseServerSelectionError
  ) {
    return res
      .status(503)
      .json({ message: "Database unavailable. Please try again." });
  }

  if (err?.code === 11000) {
    return res.status(409).json({ message: "Duplicate record" });
  }

  // eslint-disable-next-line no-console
  console.error("Unhandled API error:", err);
  return res.status(500).json({ message: "Internal server error" });
}
