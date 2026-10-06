export interface AppConfig {
  port: number;
  mongodbUri: string;
}

export function loadConfig(): AppConfig {
  const port = Number(process.env.PORT ?? "3000");

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  const mongodbUri = process.env.MONGODB_URI;

  if (mongodbUri === undefined || mongodbUri.trim().length === 0) {
    throw new Error("MONGODB_URI must be provided.");
  }

  return {
    port,
    mongodbUri,
  };
}
