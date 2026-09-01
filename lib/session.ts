import crypto from 'crypto';
import { cookies } from 'next/headers';
import type { Role } from '@prisma/client';

const COOKIE_NAME = 'bsb_session';
const SECRET = process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 дней

export type SessionPayload = {
  userId: string;
  role: Role;
  plantId: string | null;
  name: string;
};

function sign(value: string): string {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

function encode(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json, 'utf8').toString('base64url');
  const signature = sign(base64);
  return `${base64}.${signature}`;
}

function decode(token: string): SessionPayload | null {
  const [base64, signature] = token.split('.');
  if (!base64 || !signature) return null;
  const expected = sign(base64);
  // сравнение с постоянным временем
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(base64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const token = encode(payload);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decode(token);
}

export async function destroySession() {
  cookies().delete(COOKIE_NAME);
}
