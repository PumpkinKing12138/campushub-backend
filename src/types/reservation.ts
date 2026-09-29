export interface Resource {
  id: string;
  name: string;
  type: "ROOM" | "EQUIPMENT" | "LAB";
  location: string;
  isAvailable: boolean;
}

export interface Reservation {
  id: string;
  resourceId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
}

export interface CreateReservationRequest {
  resourceId: string;
  userId: string;
  startTime: string;
  endTime: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
}
