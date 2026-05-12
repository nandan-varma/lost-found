import "server-only";

import { neonConfig, Pool } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { getEnv } from "@/lib/env";
import { schema } from "./schema";

config({ path: ".env" });

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: getEnv("DATABASE_URL") });

export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === "development",
});
