import { ResourceModel } from "../models/Resource.model";
import type { Resource } from "../types/reservation";

export interface ResourceFilters {
  type?: Resource["type"];
  isAvailable?: boolean;
}

export async function listResources(
  filters: ResourceFilters = {},
): Promise<Resource[]> {
  const filter: ResourceFilters = {};

  if (filters.type !== undefined) {
    filter.type = filters.type;
  }

  if (filters.isAvailable !== undefined) {
    filter.isAvailable = filters.isAvailable;
  }

  const records = await ResourceModel.find(filter).lean().exec();

  return records.map((record): Resource => ({
    id: record._id.toString(),
    name: record.name,
    type: record.type,
    location: record.location,
    isAvailable: record.isAvailable,
  }));
}
