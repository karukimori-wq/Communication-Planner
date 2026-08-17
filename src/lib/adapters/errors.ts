export type ProviderErrorInput = {
  status?: number;
  code?: string;
  message?: string;
  retryAfter?: string;
};

export type ProviderErrorMapping = {
  code: "ADAPTER_AUTH_FAILED" | "ADAPTER_SIGNATURE_INVALID" | "ADAPTER_RATE_LIMITED" | "ADAPTER_SEND_REJECTED";
  message: string;
  retryable: boolean;
  httpStatus: number;
};

export function mapProviderError(error: ProviderErrorInput): ProviderErrorMapping {
  const status = error.status ?? 500;
  const providerCode = error.code?.toUpperCase() ?? "";
  const message = error.message ?? "Provider adapter request failed";

  if (providerCode.includes("SIGNATURE")) {
    return {
      code: "ADAPTER_SIGNATURE_INVALID",
      message,
      retryable: false,
      httpStatus: 401
    };
  }

  if (status === 401 || status === 403 || providerCode.includes("AUTH")) {
    return {
      code: "ADAPTER_AUTH_FAILED",
      message,
      retryable: false,
      httpStatus: 502
    };
  }

  if (status === 429 || providerCode.includes("RATE_LIMIT") || providerCode.includes("THROTTLE")) {
    return {
      code: "ADAPTER_RATE_LIMITED",
      message,
      retryable: true,
      httpStatus: 429
    };
  }

  return {
    code: "ADAPTER_SEND_REJECTED",
    message,
    retryable: status >= 500,
    httpStatus: status >= 500 ? 502 : 409
  };
}
