import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/health-tracker";
    await mongoose.connect(mongoURI);
    console.log("[MongoDB]: Connected successfully.");
  } catch (error) {
    console.error("[MongoDB]: Connection Error: ", error);
    process.exit(1);
  }
};

export default connectDB;
