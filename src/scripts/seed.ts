import mongoose from "mongoose";
import { connectToDatabase } from "../config/database";
import { loadConfig } from "../config/environment";
import { ResourceModel, type ResourceRecord } from "../models/Resource.model";

const initialResources: ResourceRecord[] = [
  {
    name: "Study Room 302",
    type: "ROOM",
    location: "Library, Floor 3",
    isAvailable: true,
  },
  {
    name: "3D Printer A",
    type: "EQUIPMENT",
    location: "Engineering Building, Floor 1",
    isAvailable: true,
  },
  {
    name: "Computer Lab",
    type: "LAB",
    location: "Science Building, Floor 2",
    isAvailable: true,
  },
];

async function seedResources(): Promise<void> {
  const config = loadConfig();

  await connectToDatabase(config.mongodbUri);

  try {
    for (const resource of initialResources) {
      await ResourceModel.updateOne(
        { name: resource.name },
        { $set: resource },
        { upsert: true },
      ).exec();
    }

    console.log("CampusHub resources seeded successfully.");
  } finally {
    await mongoose.disconnect();
  }
}

seedResources().catch((error: unknown): void => {
  const message =
    error instanceof Error ? error.message : "Unknown seed error.";

  console.error("Resource seeding failed:", message);
  process.exitCode = 1;
});
