import type { Request, Response } from "express";
import { getHealth, type HealthResponse } from "../services/health.service";

export function healthCheck(
  _request: Request,
  response: Response<HealthResponse>,
): void {
  response.status(200).json(getHealth());
}
