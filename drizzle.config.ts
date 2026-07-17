import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getEnv("DATABASE_URL"),
  },
});
