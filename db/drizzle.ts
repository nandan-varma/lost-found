import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { getEnv } from "@/lib/env";
import { schema } from "./schema";

config({ path: ".env" });

export const db = drizzle(getEnv("DATABASE_URL"), {
  schema,
  logger: process.env.NODE_ENV === "development",
});
