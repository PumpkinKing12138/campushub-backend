import { randomUUID } from "node:crypto";
import type {
  Resource,
  Reservation,
  CreateReservationRequest,
} from "../types/reservation";

const resources: Resource[] = [
  {
    id: "res-101",
    name: "Study Room 302",
    type: "ROOM",
    location: "Library, Floor 3",
    isAvailable: true,
  },
  {
    id: "res-102",
    name: "3D Printer A",
    type: "EQUIPMENT",
    location: "Engineering Building, Floor 1",
    isAvailable: true,
  },
  {
    id: "res-103",
    name: "Computer Lab",
    type: "LAB",
    location: "Science Building, Floor 2",
    isAvailable: true,
  },
];

export function listResources(type?: Resource["type"]): Resource[] {
  return resources
    .filter((resource: Resource): boolean => {
      return type === undefined || resource.type === type;
    })
    .map((resource: Resource): Resource => ({ ...resource }));
}

const reservations: Reservation[] = [];

export function listUserReservations(userId: string): Reservation[] {
  return reservations
    .filter((reservation: Reservation): boolean => {
      return (
        reservation.userId === userId &&
        (reservation.status === "PENDING" || reservation.status === "CONFIRMED")
      );
    })
    .map((reservation: Reservation): Reservation => ({ ...reservation }));
}

export class ReservationError extends Error {
  constructor(
    public readonly code: "VALIDATION_ERROR" | "DOUBLE_BOOKING",
    message: string,
  ) {
    super(message);
    this.name = "ReservationError";
  }
}

export function createReservation(
  input: CreateReservationRequest,
): Reservation {
  const resource = resources.find(
    (item: Resource): boolean => item.id === input.resourceId,
  );

  if (!resource || !resource.isAvailable) {
    throw new ReservationError(
      "VALIDATION_ERROR",
      "Resource does not exist or is unavailable.",
    );
  }

  const start = Date.parse(input.startTime);
  const end = Date.parse(input.endTime);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new ReservationError(
      "VALIDATION_ERROR",
      "Times must be valid, and endTime must be after startTime.",
    );
  }

  const hasConflict = reservations.some(
    (item: Reservation): boolean =>
      item.resourceId === input.resourceId &&
      item.status !== "CANCELLED" &&
      start < Date.parse(item.endTime) &&
      end > Date.parse(item.startTime),
  );

  if (hasConflict) {
    throw new ReservationError(
      "DOUBLE_BOOKING",
      "Resource is already reserved for this time slot.",
    );
  }

  const reservation: Reservation = {
    id: randomUUID(),
    resourceId: input.resourceId,
    userId: input.userId,
    startTime: input.startTime,
    endTime: input.endTime,
    status: "CONFIRMED",
  };

  reservations.push(reservation);
  return { ...reservation };
}
