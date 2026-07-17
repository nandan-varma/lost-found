import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/get-session";

export async function proxy(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/settings/sessions"],
};
