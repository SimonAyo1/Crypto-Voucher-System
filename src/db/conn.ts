import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.ATLAS_URI || "";

const connectToDB = async () => {
  try {
    const db = await mongoose.connect(connectionString);
    return db;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export default connectToDB;
