import type { Request, Response } from "express";
import type { ErrorResponse, Reservation } from "../types/reservation";
import {
  cancelReservation,
  confirmReservation,
  createReservation,
  listUserReservations,
} from "../services/reservation.service";
import { isValidReservationRequest } from "../middleware/reservation.validation";

export async function postReservation(
  request: Request<Record<string, string>, unknown, unknown>,
  response: Response<Reservation | ErrorResponse>,
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

  const reservation: Reservation = await createReservation(body);
  response.status(201).json(reservation);
}

interface UserReservationParams {
  userId: string;
}

export async function getUserReservations(
  request: Request<UserReservationParams, unknown, unknown>,
  response: Response<Reservation[] | ErrorResponse>,
): Promise<void> {
  const userId = request.params.userId;

  if (typeof userId !== "string" || userId.trim().length === 0) {
    response.status(400).json({
      code: "VALIDATION_ERROR",
      message: "userId must be a non-empty string.",
    });
    return;
  }

  const reservations: Reservation[] = await listUserReservations(userId);

  response.status(200).json(reservations);
}

interface ReservationParams {
  id: string;
}

export async function patchCancelReservation(
  request: Request<ReservationParams, unknown, unknown>,
  response: Response<Reservation | ErrorResponse>,
): Promise<void> {
  const reservation = await cancelReservation(request.params.id);

  if (reservation === null) {
    response.status(404).json({
      code: "NOT_FOUND",
      message: "Reservation does not exist.",
    });
    return;
  }

  response.status(200).json(reservation);
}

export async function patchConfirmReservation(
  request: Request<ReservationParams, unknown, unknown>,
  response: Response<Reservation | ErrorResponse>,
): Promise<void> {
  const reservation = await confirmReservation(request.params.id);

  if (reservation === null) {
    response.status(404).json({
      code: "NOT_FOUND",
      message: "Reservation does not exist.",
    });
    return;
  }

  response.status(200).json(reservation);
}
