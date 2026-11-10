import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  collectCoverageFrom: [
    "src/services/**/*.ts",
    "src/controllers/**/*.ts",
    "!**/__tests__/**",
  ],
};

export default config;
