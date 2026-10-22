// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid. SPDX-License-Identifier: MIT
import { NextResponse, type NextRequest } from 'next/server';
export class SecurityProxy {
  static handle(request: NextRequest): NextResponse {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const development = process.env.NODE_ENV !== 'production';
    const policy = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'${development ? ' ws: wss:' : ''}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`;
    const headers = new Headers(request.headers);
    headers.set('Content-Security-Policy', policy);
    headers.set('x-nonce', nonce);
    const response = NextResponse.next({ request: { headers } });
    response.headers.set('Content-Security-Policy', policy);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'same-origin');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}
export const proxy = SecurityProxy.handle;
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
