import { expect, test } from "@jest/globals";
import mongoose from "mongoose";

test("the test database responds to ping", async () => {
  const reply = await mongoose.connection.db?.command({ ping: 1 });
  expect(reply?.ok).toBe(1);
});
