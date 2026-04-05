import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is missing");
  }

  mongoose.connection.on("error", (error) => {
    // eslint-disable-next-line no-console
    console.error("Mongo connection error:", error?.message || error);
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
}
