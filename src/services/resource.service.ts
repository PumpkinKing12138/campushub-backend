import { ResourceModel } from "../models/Resource.model";
import type { Resource } from "../types/reservation";

export async function listResources(
  type?: Resource["type"],
): Promise<Resource[]> {
  const filter = type === undefined ? {} : { type };

  const records = await ResourceModel.find(filter).lean().exec();

  return records.map((record): Resource => ({
    id: record._id.toString(),
    name: record.name,
    type: record.type,
    location: record.location,
    isAvailable: record.isAvailable,
  }));
}
