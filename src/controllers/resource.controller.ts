import type { NextFunction, Request, Response } from "express";
import { listResources } from "../services/resource.service";
import type { ErrorResponse, Resource } from "../types/reservation";

export async function getResources(
  request: Request,
  response: Response<Resource[] | ErrorResponse>,
  next: NextFunction,
): Promise<void> {
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

  try {
    const resources: Resource[] = await listResources(type);
    response.status(200).json(resources);
  } catch (error: unknown) {
    next(error);
  }
}
