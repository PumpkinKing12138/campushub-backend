import express, { type Express } from "express";
import { connectToDatabase } from "./config/database";
import { loadConfig } from "./config/environment";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { healthRouter } from "./routes/health.routes";
import reservationRouter from "./routes/reservation.routes";
import resourceRouter from "./routes/resource.routes";

export const app: Express = express();

app.disable("x-powered-by");
app.use(express.json());
app.use("/api/v1", healthRouter);
app.use("/api/v1", resourceRouter);
app.use("/api/v1", reservationRouter);
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer(): Promise<void> {
  const config = loadConfig();

  await connectToDatabase(config.mongodbUri);

  const server = app.listen(config.port, (): void => {
    console.log(`CampusHub listening on http://localhost:${config.port}`);
  });

  server.on("error", (error: Error): void => {
    console.error("Server failed to start:", error.message);
    process.exitCode = 1;
  });
}

if (require.main === module) {
  startServer().catch((error: unknown): void => {
    const message =
      error instanceof Error ? error.message : "Unknown startup error.";

    console.error("Application startup failed:", message);
    process.exitCode = 1;
  });
}
