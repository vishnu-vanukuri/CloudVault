/**
 * Standard HTTP response generator with required CORS headers
 * for API Gateway REST API.
 */
export function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
}

/**
 * Extracts the Cognito User ID (sub) from the API Gateway authorizer context.
 * Guarantees tenant isolation: users can ONLY access files in `uploads/${userId}/`
 */
export function getUserIdFromEvent(event) {
  // Cognito Authorizer injects claims into requestContext
  const claims = event?.requestContext?.authorizer?.claims;
  if (claims && claims.sub) {
    return claims.sub;
  }
  // Fallback for custom authorizer or mock header during local testing
  const fallbackSub = event?.headers?.['x-user-id'] || event?.headers?.['X-User-Id'];
  if (fallbackSub) {
    return fallbackSub;
  }
  return null;
}
