'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  clearAdminSession,
  clearCustomerSession,
  isStoreAdmin,
  setAdminSession,
  setCustomerSession,
} from '@/lib/auth/session';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { localizePath } from '@/lib/i18n/routes';
import { rateLimit } from '@/lib/security/rate-limit';
import { strapi, StrapiError } from '@/lib/strapi/client';

export type AuthState = { error?: 'invalid' | 'taken' | 'rateLimited' | 'generic' | 'weak'; email?: string };

type AuthResponse = { jwt: string; user: { id: number; email: string } };

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

const registerSchema = z.object({
  username: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(8)
    .max(200)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});

const localeOf = (formData: FormData): Locale => {
  const l = String(formData.get('locale') ?? 'es');
  return isLocale(l) ? l : 'es';
};

function mapError(error: unknown): AuthState['error'] {
  if (error instanceof StrapiError) {
    if (error.status === 429) return 'rateLimited';
    if (error.status === 400 && /already taken|ya/i.test(error.message)) return 'taken';
    if (error.status === 400) return 'invalid';
  }
  console.error('[auth]', error);
  return 'generic';
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'invalid' };
  if (!(await rateLimit('login', 10, 15 * 60_000))) return { error: 'rateLimited', email: parsed.data.email };

  try {
    const res = await strapi<AuthResponse>('/auth/local', {
      method: 'POST',
      auth: 'none',
      body: { identifier: parsed.data.email, password: parsed.data.password },
    });
    await setCustomerSession(res.jwt);
  } catch (error) {
    return { error: mapError(error), email: parsed.data.email };
  }
  redirect(localizePath(localeOf(formData), '/cuenta'));
}

export async function register(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const weak = parsed.error.issues.some((i) => i.path[0] === 'password');
    return { error: weak ? 'weak' : 'invalid', email: String(formData.get('email') ?? '') };
  }
  if (!(await rateLimit('register', 5, 60 * 60_000))) return { error: 'rateLimited' };

  try {
    const res = await strapi<AuthResponse>('/auth/local/register', { method: 'POST', auth: 'none', body: parsed.data });
    await setCustomerSession(res.jwt);
  } catch (error) {
    return { error: mapError(error), email: parsed.data.email };
  }
  redirect(localizePath(localeOf(formData), '/cuenta'));
}

export async function logout(formData: FormData) {
  await clearCustomerSession();
  redirect(localizePath(localeOf(formData), '/'));
}

/** Login del dashboard: mismo usuario de Strapi, pero exige el rol "Store Admin". */
export async function adminLogin(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'invalid' };
  if (!(await rateLimit('admin-login', 5, 15 * 60_000))) return { error: 'rateLimited' };

  try {
    const res = await strapi<AuthResponse>('/auth/local', {
      method: 'POST',
      auth: 'none',
      body: { identifier: parsed.data.email, password: parsed.data.password },
    });
    // Mismo mensaje para "no existe" y "no es admin": no se revela qué cuentas tienen acceso.
    if (!(await isStoreAdmin(res.user.id))) return { error: 'invalid' };
    await setAdminSession(res.jwt);
  } catch (error) {
    return { error: mapError(error) };
  }
  redirect('/admin');
}

export async function adminLogout() {
  await clearAdminSession();
  redirect('/admin/login');
}
