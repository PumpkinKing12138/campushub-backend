import { afterAll, afterEach, beforeAll } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as os from "node:os";

let mongoServer: MongoMemoryServer | undefined;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
  runtimeAdapters: { os },
});
}, 120_000);

afterEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  try {
    await mongoose.disconnect();
  } finally {
    await mongoServer?.stop();
  }
});
