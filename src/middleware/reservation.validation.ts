import type { CreateReservationRequest } from "../types/reservation";

export function isValidDateTime(value: string): boolean {
  const pattern =
    /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])[Tt]([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:[Zz]|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

  const match = pattern.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

  const daysInMonth: number[] = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  const maxDay = daysInMonth[month - 1];

  return (
    maxDay !== undefined && day <= maxDay && Number.isFinite(Date.parse(value))
  );
}

export function isValidReservationRequest(
  value: unknown,
): value is CreateReservationRequest {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const allowedFields: string[] = [
    "resourceId",
    "userId",
    "startTime",
    "endTime",
  ];

  if (
    Object.keys(value).some(
      (key: string): boolean => !allowedFields.includes(key),
    )
  ) {
    return false;
  }

  return (
    "resourceId" in value &&
    typeof value.resourceId === "string" &&
    value.resourceId.trim().length > 0 &&
    "userId" in value &&
    typeof value.userId === "string" &&
    value.userId.trim().length > 0 &&
    "startTime" in value &&
    typeof value.startTime === "string" &&
    isValidDateTime(value.startTime) &&
    "endTime" in value &&
    typeof value.endTime === "string" &&
    isValidDateTime(value.endTime)
  );
}
