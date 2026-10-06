import { Schema, model } from "mongoose";

export type ResourceType = "ROOM" | "EQUIPMENT" | "LAB";

export interface ResourceRecord {
  name: string;
  type: ResourceType;
  location: string;
  isAvailable: boolean;
}

const resourceSchema = new Schema<ResourceRecord>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  },
  type: {
    type: String,
    required: true,
    enum: ["ROOM", "EQUIPMENT", "LAB"],
  },
  location: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  },
  isAvailable: {
    type: Boolean,
    required: true,
    default: true,
  },
});

export const ResourceModel = model<ResourceRecord>("Resource", resourceSchema);
