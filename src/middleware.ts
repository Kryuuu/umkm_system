import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === '/';
  
  const token = request.cookies.get('auth_token')?.value || '';

  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isPublicPath && token) {
    try {
      await jwtVerify(token, secretKey);
      // Valid token on login page -> redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (e) {
      // Invalid token, ignore and let them login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
