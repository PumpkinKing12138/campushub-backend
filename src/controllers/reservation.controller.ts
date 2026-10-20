import type { NextFunction, Request, Response } from "express";
import type { ErrorResponse, Reservation } from "../types/reservation";
import {
  cancelReservation,
  confirmReservation,
  createReservation,
  listUserReservations,
  ReservationError,
} from "../services/reservation.service";
import { isValidReservationRequest } from "../middleware/reservation.validation";

export async function postReservation(
  request: Request<Record<string, string>, unknown, unknown>,
  response: Response<Reservation | ErrorResponse>,
  next: NextFunction,
): Promise<void> {
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
    const reservation: Reservation = await createReservation(body);
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

export async function getUserReservations(
  request: Request<UserReservationParams, unknown, unknown>,
  response: Response<Reservation[] | ErrorResponse>,
  next: NextFunction,
): Promise<void> {
  const userId = request.params.userId;

  if (typeof userId !== "string" || userId.trim().length === 0) {
    response.status(400).json({
      code: "VALIDATION_ERROR",
      message: "userId must be a non-empty string.",
    });
    return;
  }

  try {
    const reservations: Reservation[] = await listUserReservations(userId);

    response.status(200).json(reservations);
  } catch (error: unknown) {
    next(error);
  }
}

interface ReservationParams {
  id: string;
}

export async function patchCancelReservation(
  request: Request<ReservationParams, unknown, unknown>,
  response: Response<Reservation | ErrorResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const reservation = await cancelReservation(request.params.id);

    if (reservation === null) {
      response.status(404).json({
        code: "NOT_FOUND",
        message: "Reservation does not exist.",
      });
      return;
    }

    response.status(200).json(reservation);
  } catch (error: unknown) {
    if (error instanceof ReservationError) {
      response.status(400).json({
        code: error.code,
        message: error.message,
      });
      return;
    }

    next(error);
  }
}

export async function patchConfirmReservation(
  request: Request<ReservationParams, unknown, unknown>,
  response: Response<Reservation | ErrorResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const reservation = await confirmReservation(request.params.id);

    if (reservation === null) {
      response.status(404).json({
        code: "NOT_FOUND",
        message: "Reservation does not exist.",
      });
      return;
    }

    response.status(200).json(reservation);
  } catch (error: unknown) {
    if (error instanceof ReservationError) {
      response.status(error.code === "INVALID_TRANSITION" ? 409 : 400).json({
        code: error.code,
        message: error.message,
      });
      return;
    }

    next(error);
  }
}
