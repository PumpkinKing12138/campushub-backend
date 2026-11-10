import { expect, test } from "@jest/globals";
import request from "supertest";
import { app } from "../../app";
import { ResourceModel } from "../../models/Resource.model";
import { ReservationModel } from "../../models/Reservation.model";

test("POST /api/v1/reservations returns 201 for a valid booking", async () => {
  const room = await ResourceModel.create({
    name: "Study Room A",
    type: "ROOM",
    location: "Library",
  });

  const booking = {
    resourceId: room._id.toString(),
    userId: "student-1",
    startTime: "2030-04-10T10:00:00.000Z",
    endTime: "2030-04-10T11:00:00.000Z",
  };

  const response = await request(app)
    .post("/api/v1/reservations")
    .send(booking)
    .expect(201);

  expect(response.body).toMatchObject({
    ...booking,
    id: expect.any(String),
    status: "CONFIRMED",
  });
});

test("POST /api/v1/reservations returns 409 for overlapping bookings", async () => {
  const room = await ResourceModel.create({
    name: "Study Room B",
    type: "ROOM",
    location: "Library",
  });
  const resourceId = room._id.toString();

  await request(app)
    .post("/api/v1/reservations")
    .send({
      resourceId,
      userId: "student-1",
      startTime: "2030-04-10T10:00:00.000Z",
      endTime: "2030-04-10T11:00:00.000Z",
    })
    .expect(201);

  const response = await request(app)
    .post("/api/v1/reservations")
    .send({
      resourceId,
      userId: "student-2",
      startTime: "2030-04-10T10:30:00.000Z",
      endTime: "2030-04-10T11:30:00.000Z",
    })
    .expect(409);

  expect(response.body).toMatchObject({ code: "DOUBLE_BOOKING" });
});

test("GET /api/v1/resources returns 200 and filters by type and availability", async () => {
  const room = await ResourceModel.create({
    name: "Study Room A",
    type: "ROOM",
    location: "Library",
    isAvailable: true,
  });

  await ResourceModel.create([
    {
      name: "Closed Room",
      type: "ROOM",
      location: "Library",
      isAvailable: false,
    },
    {
      name: "Projector",
      type: "EQUIPMENT",
      location: "Library",
      isAvailable: true,
    },
  ]);

  const response = await request(app)
    .get("/api/v1/resources")
    .query({ type: "ROOM", isAvailable: "true" })
    .expect(200);

  expect(response.body).toEqual([
    {
      id: room._id.toString(),
      name: "Study Room A",
      type: "ROOM",
      location: "Library",
      isAvailable: true,
    },
  ]);
});

test("PATCH cancel returns 200 and the cancelled reservation", async () => {
  const room = await ResourceModel.create({
    name: "Study Room C",
    type: "ROOM",
    location: "Library",
  });

  const created = await request(app)
    .post("/api/v1/reservations")
    .send({
      resourceId: room._id.toString(),
      userId: "student-3",
      startTime: "2030-04-10T14:00:00.000Z",
      endTime: "2030-04-10T15:00:00.000Z",
    })
    .expect(201);

  const response = await request(app)
    .patch(`/api/v1/reservations/${created.body.id}/cancel`)
    .expect(200);

  expect(response.body).toEqual({ ...created.body, status: "CANCELLED" });
});

test("PATCH cancel returns 404 when the reservation does not exist", async () => {
  const missingId = "000000000000000000000001";

  const response = await request(app)
    .patch(`/api/v1/reservations/${missingId}/cancel`)
    .expect(404);

  expect(response.body).toMatchObject({ code: "NOT_FOUND" });
});

test("PATCH confirm changes a pending reservation to confirmed", async () => {
  const room = await ResourceModel.create({
    name: "Study Room D",
    type: "ROOM",
    location: "Library",
  });

  const pending = await ReservationModel.create({
    resourceId: room._id,
    userId: "student-4",
    startTime: new Date("2030-04-10T14:00:00.000Z"),
    endTime: new Date("2030-04-10T15:00:00.000Z"),
    status: "PENDING",
  });

  const response = await request(app)
    .patch(`/api/v1/reservations/${pending.id}/confirm`)
    .expect(200);

  expect(response.body).toMatchObject({
    id: pending._id.toString(),
    status: "CONFIRMED",
  });

  const saved = await ReservationModel.findById(pending._id);
  expect(saved?.status).toBe("CONFIRMED");
});

test("PATCH confirm returns 404 when the reservation does not exist", async () => {
  const missingId = "000000000000000000000001";

  const response = await request(app)
    .patch(`/api/v1/reservations/${missingId}/confirm`)
    .expect(404);

  expect(response.body).toMatchObject({ code: "NOT_FOUND" });
});
test("GET /api/v1/resources returns all resources when no filters are given", async () => {
  await ResourceModel.create([
    { name: "Open Room", type: "ROOM", location: "Library", isAvailable: true },
    { name: "Closed Lab", type: "LAB", location: "Science Hall", isAvailable: false },
  ]);

  const response = await request(app).get("/api/v1/resources").expect(200);

  expect(response.body).toHaveLength(2);
  expect(response.body).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: "Open Room", isAvailable: true }),
    expect.objectContaining({ name: "Closed Lab", isAvailable: false }),
  ]));
});

test.each([
  { param: "type", value: "UNKNOWN" },
  { param: "isAvailable", value: "sometimes" },
])("GET /api/v1/resources rejects invalid $param", async ({ param, value }) => {
  const response = await request(app)
    .get("/api/v1/resources")
    .query({ [param]: value })
    .expect(400);

  expect(response.body).toMatchObject({ code: "VALIDATION_ERROR" });
});

test("POST /api/v1/reservations returns 400 when endTime is missing", async () => {
  const room = await ResourceModel.create({
    name: "Study Room E",
    type: "ROOM",
    location: "Library",
  });

  const response = await request(app)
    .post("/api/v1/reservations")
    .send({
      resourceId: room._id.toString(),
      userId: "student-5",
      startTime: "2030-04-10T10:00:00.000Z",
    })
    .expect(400);

  expect(response.body).toMatchObject({ code: "VALIDATION_ERROR" });
  expect(await ReservationModel.countDocuments()).toBe(0);
});
