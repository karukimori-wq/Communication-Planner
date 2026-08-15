import { NextResponse } from "next/server";
import type { ApiError, ApiResponse, PlatformStatus } from "./types";

export function requestMeta(request: Request) {
  return {
    traceId: request.headers.get("x-trace-id") ?? crypto.randomUUID(),
    correlationId: request.headers.get("x-correlation-id") ?? undefined,
    sourceApp: request.headers.get("x-source-app") ?? undefined
  };
}

export function ok<T>(data: T, init?: { eventName?: string; traceId?: string; correlationId?: string; status?: PlatformStatus }) {
  const body: ApiResponse<T> = {
    status: init?.status ?? "success",
    data,
    traceId: init?.traceId,
    correlationId: init?.correlationId,
    eventName: init?.eventName,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(body);
}

export function fail(code: string, message: string, httpStatus = 400, init?: { retryable?: boolean; traceId?: string; correlationId?: string }) {
  const error: ApiError = {
    code,
    message,
    retryable: init?.retryable ?? false
  };
  const body: ApiResponse<never> = {
    status: "error",
    error,
    traceId: init?.traceId,
    correlationId: init?.correlationId,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(body, { status: httpStatus });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function requireString(value: unknown, fieldName: string): string | ApiError {
  if (typeof value !== "string" || value.trim().length === 0) {
    return {
      code: "VALIDATION_ERROR",
      message: `${fieldName} is required`,
      retryable: false
    };
  }

  return value.trim();
}
