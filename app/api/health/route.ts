import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";

export async function GET() {
  try {
    await db.execute(sql`select 1`);

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
