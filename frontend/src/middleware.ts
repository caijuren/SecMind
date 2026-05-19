import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isDev = process.env.NODE_ENV === "development";

function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configured) {
    return configured;
  }

  if (isDev) {
    return "http://127.0.0.1:8000/api/v1";
  }

  return "https://api.secmind.com/api/v1";
}

function toWebSocketOrigin(origin: string): string {
  return origin.startsWith("https://")
    ? origin.replace("https://", "wss://")
    : origin.replace("http://", "ws://");
}

function buildConnectSrc(): string {
  const allowedOrigins = new Set([
    "'self'",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "ws://localhost:8000",
    "ws://127.0.0.1:8000",
  ]);

  try {
    const apiOrigin = new URL(getApiBaseUrl()).origin;
    allowedOrigins.add(apiOrigin);
    allowedOrigins.add(toWebSocketOrigin(apiOrigin));
  } catch {
    // Ignore invalid env values and keep safe defaults.
  }

  return Array.from(allowedOrigins).join(" ");
}

const scriptSrc = "'self' 'unsafe-inline'";

const cspValue = `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://trae-api-cn.mchost.guru; font-src 'self' data:; connect-src ${buildConnectSrc()}; frame-ancestors 'none'; form-action 'self'; object-src 'none'; base-uri 'self'`;

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", cspValue);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "next-action" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
