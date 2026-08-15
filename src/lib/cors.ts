export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Trace-Id, X-Correlation-Id, X-Source-App",
  "Access-Control-Max-Age": "86400"
};

export function withCors(headers?: HeadersInit): HeadersInit {
  return {
    ...corsHeaders,
    ...headers
  };
}
