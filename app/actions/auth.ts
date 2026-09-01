'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { createSession, destroySession } from '@/lib/session';
import { redirect } from 'next/navigation';

const registerSchema = z.object({
  name: z.string().min(2, 'Введите имя'),
  phone: z.string().min(5, 'Введите телефон'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function registerClient(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, phone, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: 'Пользователь с таким email уже существует' };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, phone, email, passwordHash, role: 'CLIENT' },
  });

  await createSession({ userId: user.id, role: user.role, plantId: null, name: user.name });
  redirect('/client/orders');
}

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export async function login(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, error: 'Неверный email или пароль' };
  }

  await createSession({
    userId: user.id,
    role: user.role,
    plantId: user.plantId ?? null,
    name: user.name,
  });

  if (user.role === 'ADMIN') redirect('/admin');
  if (user.role === 'PLANT') redirect('/plant');
  redirect('/client/orders');
}

export async function logout() {
  await destroySession();
  redirect('/');
}
