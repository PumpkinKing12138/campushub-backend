import type { NextFunction, Request, Response } from "express";

import { ReservationError } from "../services/reservation.service";
import type { ErrorResponse } from "../types/reservation";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response<ErrorResponse>,
  next: NextFunction,
): void {
  if (response.headersSent) {
    next(error);
    return;
  }
  if (
    error instanceof SyntaxError &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    response.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Request body must contain valid JSON.",
    });
    return;
  }
  if (error instanceof ReservationError) {
    const status = error.code === "VALIDATION_ERROR" ? 400 : 409;
    response.status(status).json({ code: error.code, message: error.message });
    return;
  }
  console.error("Request failed:", error);
  response.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  });
}

export function notFoundHandler(
  _request: Request,
  response: Response<ErrorResponse>,
): void {
  response.status(404).json({
    code: "NOT_FOUND",
    message: "Not found",
  });
}
