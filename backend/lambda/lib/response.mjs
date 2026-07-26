const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || '*'
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    Vary: 'Origin',
  }
}

export function json(statusCode, body, origin) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    body: JSON.stringify(body ?? {}),
  }
}

export function noContent(origin) {
  return { statusCode: 204, headers: corsHeaders(origin), body: '' }
}

export class ApiError extends Error {
  constructor(statusCode, message, code) {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

export function errorResponse(err, origin) {
  if (err instanceof ApiError) {
    return json(err.statusCode, { message: err.message, code: err.code }, origin)
  }
  console.error(err)
  return json(500, { message: 'Internal server error' }, origin)
}
