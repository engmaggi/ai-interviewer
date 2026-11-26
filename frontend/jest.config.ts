
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config = {
  coverageProvider: "v8" as const,
  testEnvironment: "jsdom",
    moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: [
    "<rootDir>/src/**/*.test.ts",
    "<rootDir>/src/**/*.test.tsx",
  ],
};

export default createJestConfig(config);
