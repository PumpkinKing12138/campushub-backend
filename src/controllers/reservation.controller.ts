import type { NextFunction, Request, Response } from "express";
import type {
  ErrorResponse,
  Reservation,
  Resource,
} from "../types/reservation";
import {
  createReservation,
  listResources,
  listUserReservations,
  ReservationError,
} from "../services/reservation.service";
import { isValidReservationRequest } from "../middleware/reservation.validation";

export function getResources(
  request: Request,
  response: Response<Resource[] | ErrorResponse>,
): void {
  const type = request.query.type;

  if (
    type !== undefined &&
    type !== "ROOM" &&
    type !== "EQUIPMENT" &&
    type !== "LAB"
  ) {
    response.status(400).json({
      code: "VALIDATION_ERROR",
      message: "type must be ROOM, EQUIPMENT, or LAB when provided.",
    });
    return;
  }

  response.status(200).json(listResources(type));
}

export function postReservation(
  request: Request<Record<string, string>, unknown, unknown>,
  response: Response<Reservation | ErrorResponse>,
  next: NextFunction,
): void {
  const body: unknown = request.body;

  if (!isValidReservationRequest(body)) {
    response.status(400).json({
      code: "VALIDATION_ERROR",
      message:
        "Provide only resourceId, userId, startTime, and endTime, with non-empty IDs and valid date-time values.",
    });
    return;
  }

  try {
    const reservation: Reservation = createReservation(body);
    response.status(201).json(reservation);
  } catch (error: unknown) {
    if (error instanceof ReservationError) {
      const status: 400 | 409 = error.code === "DOUBLE_BOOKING" ? 409 : 400;

      response.status(status).json({
        code: error.code,
        message: error.message,
      });
      return;
    }

    next(error);
  }
}

interface UserReservationParams {
  userId: string;
}

export function getUserReservations(
  request: Request<UserReservationParams, unknown, unknown>,
  response: Response<Reservation[] | ErrorResponse>,
): void {
  const userId = request.params.userId;

  if (typeof userId !== "string" || userId.trim().length === 0) {
    response.status(400).json({
      code: "VALIDATION_ERROR",
      message: "userId must be a non-empty string.",
    });
    return;
  }

  response.status(200).json(listUserReservations(userId));
}
