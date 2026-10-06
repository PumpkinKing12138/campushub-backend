import mongoose from "mongoose";

export async function connectToDatabase(mongodbUri: string): Promise<void> {
  await mongoose.connect(mongodbUri);
}
