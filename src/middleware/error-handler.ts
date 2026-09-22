import type { NextFunction, Request, Response } from "express";

export interface ErrorResponse {
  error: string;
}

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
  console.error("Request failed:", error);
  response.status(500).json({ error: "Internal server error" });
}

export function notFoundHandler(
  _request: Request,
  response: Response<ErrorResponse>,
): void {
  response.status(404).json({ error: "Not found" });
}
