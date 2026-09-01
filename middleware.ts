import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'bsb_session';
const SECRET =
  process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me';

const ROLE_PREFIXES: { prefix: string; role: string }[] = [
  { prefix: '/admin', role: 'ADMIN' },
  { prefix: '/plant', role: 'PLANT' },
  { prefix: '/client', role: 'CLIENT' },
];

function base64UrlToUint8Array(base64: string): Uint8Array {
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function verify(
  token: string
): Promise<{ role: string } | null> {
  const [base64, signature] = token.split('.');

  if (!base64 || !signature) {
    return null;
  }

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SECRET),
      {
        name: 'HMAC',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(base64)
    );

    const expected = uint8ArrayToHex(
      new Uint8Array(signatureBuffer)
    );

    if (signature !== expected) {
      return null;
    }

    const json = new TextDecoder().decode(
      base64UrlToUint8Array(base64)
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const match = ROLE_PREFIXES.find((r) =>
    pathname.startsWith(r.prefix)
  );

  if (!match) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verify(token) : null;

  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);

    return NextResponse.redirect(url);
  }

  if (session.role !== match.role) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/plant/:path*', '/client/:path*'],
};
