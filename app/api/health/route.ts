import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    await db.execute(sql`select 1`);

    logger.info("health: ok");

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("health: failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
