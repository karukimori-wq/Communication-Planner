import { NextResponse } from "next/server";
import { withCors } from "./lib/cors";

export function middleware(request: Request) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: withCors() });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/health", "/version", "/contracts/status"]
};
