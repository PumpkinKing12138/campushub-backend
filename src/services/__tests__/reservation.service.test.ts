import { expect, test } from "@jest/globals";
import { ResourceModel } from "../../models/Resource.model";
import {
  cancelReservation,
  createReservation,
  listUserReservations,
} from "../reservation.service";

test("books an available room and saves the confirmed reservation", async () => {
  const room = await ResourceModel.create({
    name: "Study Room A",
    type: "ROOM",
    location: "Library",
  });

  const request = {
    resourceId: room._id.toString(),
    userId: "student-1",
    startTime: "2030-04-10T10:00:00.000Z",
    endTime: "2030-04-10T11:00:00.000Z",
  };

  const reservation = await createReservation(request);

  expect(reservation).toMatchObject({ ...request, status: "CONFIRMED" });
  expect(await listUserReservations(request.userId)).toEqual([reservation]);
});

test("cancels a confirmed reservation and saves its new status", async () => {
  const room = await ResourceModel.create({
    name: "Study Room B",
    type: "ROOM",
    location: "Library",
  });

  const booking = await createReservation({
    resourceId: room._id.toString(),
    userId: "student-2",
    startTime: "2030-04-10T12:00:00.000Z",
    endTime: "2030-04-10T13:00:00.000Z",
  });

  const cancelled = await cancelReservation(booking.id);
  const expected = { ...booking, status: "CANCELLED" };

  expect(cancelled).toEqual(expected);
  expect(await listUserReservations(booking.userId)).toEqual([expected]);
});

test.each([
  {
    scenario: "the exact same time slot",
    startTime: "2030-04-10T10:00:00.000Z",
    endTime: "2030-04-10T11:00:00.000Z",
  },
  {
    scenario: "a one-millisecond overlap",
    startTime: "2030-04-10T10:59:59.999Z",
    endTime: "2030-04-10T12:00:00.000Z",
  },
])("rejects $scenario", async ({ startTime, endTime }) => {
  const room = await ResourceModel.create({
    name: "Study Room C",
    type: "ROOM",
    location: "Library",
  });
  const resourceId = room._id.toString();

  await createReservation({
    resourceId,
    userId: "student-1",
    startTime: "2030-04-10T10:00:00.000Z",
    endTime: "2030-04-10T11:00:00.000Z",
  });

  await expect(
    createReservation({ resourceId, userId: "student-2", startTime, endTime }),
  ).rejects.toMatchObject({ code: "DOUBLE_BOOKING" });

  expect(await listUserReservations("student-2")).toHaveLength(0);
});

test("rejects a reservation that ends before it starts", async () => {
  const room = await ResourceModel.create({
    name: "Study Room D",
    type: "ROOM",
    location: "Library",
  });

  const request = {
    resourceId: room._id.toString(),
    userId: "student-3",
    startTime: "2030-04-10T11:00:00.000Z",
    endTime: "2030-04-10T10:00:00.000Z",
  };

  await expect(createReservation(request)).rejects.toMatchObject({
    code: "VALIDATION_ERROR",
  });
  expect(await listUserReservations(request.userId)).toHaveLength(0);
});

test("rejects a reservation for a resource that does not exist", async () => {
  const request = {
    resourceId: "000000000000000000000001",
    userId: "student-4",
    startTime: "2030-04-10T10:00:00.000Z",
    endTime: "2030-04-10T11:00:00.000Z",
  };

  await expect(createReservation(request)).rejects.toMatchObject({
    code: "VALIDATION_ERROR",
    message: "Resource does not exist or is unavailable.",
  });
  expect(await listUserReservations(request.userId)).toHaveLength(0);
});
