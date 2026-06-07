import type { NextFunction, Request, Response } from 'express';

export const apiSecurityHeaders = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
  ['Cross-Origin-Opener-Policy', 'same-origin'],
  ['Cross-Origin-Resource-Policy', 'same-site'],
] as const;

export function setApiSecurityHeaders(response: Pick<Response, 'setHeader'>) {
  for (const [name, value] of apiSecurityHeaders) {
    response.setHeader(name, value);
  }
}

export function securityHeadersMiddleware(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  setApiSecurityHeaders(response);
  next();
}
