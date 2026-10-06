import { Schema, model, Types } from "mongoose";

export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface ReservationRecord {
  resourceId: Types.ObjectId;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
}

const reservationSchema = new Schema<ReservationRecord>({
  resourceId: {
    type: Schema.Types.ObjectId,
    ref: "Resource",
    required: true,
  },
  userId: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["PENDING", "CONFIRMED", "CANCELLED"],
    default: "PENDING",
  },
});

export const ReservationModel = model<ReservationRecord>(
  "Reservation",
  reservationSchema,
);
