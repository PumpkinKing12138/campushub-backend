import express, { type Express } from "express";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { healthRouter } from "./routes/health.routes";

export const app: Express = express();
app.disable("x-powered-by");
app.use("/api/v1", healthRouter);
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  const port: number = Number(process.env.PORT ?? "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  const server = app.listen(port, (): void => {
    console.log(`CampusHub listening on http://localhost:${port}`);
  });
  server.on("error", (error: Error): void => {
    console.error("Server failed to start:", error.message);
    process.exitCode = 1;
  });
}
