import { Types } from "mongoose";
import { ReservationModel } from "../models/Reservation.model";
import { ResourceModel } from "../models/Resource.model";
import type {
  CreateReservationRequest,
  Reservation,
} from "../types/reservation";

export class ReservationError extends Error {
  constructor(
    public readonly code:
      "VALIDATION_ERROR" | "DOUBLE_BOOKING" | "INVALID_TRANSITION",
    message: string,
  ) {
    super(message);
    this.name = "ReservationError";
  }
}

export async function listUserReservations(
  userId: string,
): Promise<Reservation[]> {
  const records = await ReservationModel.find({ userId }).lean().exec();

  return records.map((record): Reservation => ({
    id: record._id.toString(),
    resourceId: record.resourceId.toString(),
    userId: record.userId,
    startTime: record.startTime.toISOString(),
    endTime: record.endTime.toISOString(),
    status: record.status,
  }));
}

export async function createReservation(
  input: CreateReservationRequest,
): Promise<Reservation> {
  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  if (
    Number.isNaN(startTime.getTime()) ||
    Number.isNaN(endTime.getTime()) ||
    endTime <= startTime
  ) {
    throw new ReservationError(
      "VALIDATION_ERROR",
      "Times must be valid, and endTime must be after startTime.",
    );
  }

  if (!Types.ObjectId.isValid(input.resourceId)) {
    throw new ReservationError(
      "VALIDATION_ERROR",
      "Resource does not exist or is unavailable.",
    );
  }

  const resourceId = new Types.ObjectId(input.resourceId);
  const resource = await ResourceModel.findById(resourceId).lean().exec();

  if (resource === null || !resource.isAvailable) {
    throw new ReservationError(
      "VALIDATION_ERROR",
      "Resource does not exist or is unavailable.",
    );
  }

  const conflictingReservation = await ReservationModel.exists({
    resourceId,
    status: { $in: ["PENDING", "CONFIRMED"] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });

  if (conflictingReservation !== null) {
    throw new ReservationError(
      "DOUBLE_BOOKING",
      "Resource is already reserved for this time slot.",
    );
  }

  const record = await ReservationModel.create({
    resourceId,
    userId: input.userId,
    startTime,
    endTime,
    status: "CONFIRMED",
  });

  return {
    id: record._id.toString(),
    resourceId: record.resourceId.toString(),
    userId: record.userId,
    startTime: record.startTime.toISOString(),
    endTime: record.endTime.toISOString(),
    status: record.status,
  };
}

export async function cancelReservation(
  id: string,
): Promise<Reservation | null> {
  if (!Types.ObjectId.isValid(id)) {
    throw new ReservationError(
      "VALIDATION_ERROR",
      "id must be a valid reservation ID.",
    );
  }

  const record = await ReservationModel.findByIdAndUpdate(
    id,
    { $set: { status: "CANCELLED" } },
    { returnDocument: "after", runValidators: true },
  )
    .lean()
    .exec();

  if (record === null) {
    return null;
  }

  return {
    id: record._id.toString(),
    resourceId: record.resourceId.toString(),
    userId: record.userId,
    startTime: record.startTime.toISOString(),
    endTime: record.endTime.toISOString(),
    status: record.status,
  };
}

export async function confirmReservation(
  id: string,
): Promise<Reservation | null> {
  if (!Types.ObjectId.isValid(id)) {
    throw new ReservationError(
      "VALIDATION_ERROR",
      "id must be a valid reservation ID.",
    );
  }

  const updated = await ReservationModel.findOneAndUpdate(
    { _id: id, status: "PENDING" },
    { $set: { status: "CONFIRMED" } },
    { returnDocument: "after", runValidators: true },
  )
    .lean()
    .exec();

  const record = updated ?? (await ReservationModel.findById(id).lean().exec());

  if (record === null) {
    return null;
  }

  if (record.status === "CANCELLED") {
    throw new ReservationError(
      "INVALID_TRANSITION",
      "Cancelled reservations cannot be confirmed.",
    );
  }

  return {
    id: record._id.toString(),
    resourceId: record.resourceId.toString(),
    userId: record.userId,
    startTime: record.startTime.toISOString(),
    endTime: record.endTime.toISOString(),
    status: record.status,
  };
}
