// =====================================
// FLUX - Standard Response Helpers
// =====================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

export interface SuccessResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    [key: string]: unknown;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Create success response
 */
export function success<T>(
  data: T,
  meta?: SuccessResponse<T>['meta'],
  status = 200
): Response {
  return new Response(
    JSON.stringify({ data, ...(meta && { meta }) }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create error response
 */
export function error(
  code: string,
  message: string,
  details?: unknown,
  status = 400
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
        ...(details && { details }),
      },
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle CORS preflight
 */
export function cors(): Response {
  return new Response('ok', { headers: corsHeaders });
}

