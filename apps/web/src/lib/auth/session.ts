import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { strapi, StrapiError } from '@/lib/strapi/client';
import { ADMIN_COOKIE, ADMIN_MAX_AGE, CUSTOMER_COOKIE, SESSION_MAX_AGE } from './cookies';

export type SessionUser = { id: number; documentId: string; username: string; email: string };

const STORE_ADMIN_ROLE = 'store-admin';

/**
 * El JWT de Strapi vive en una cookie httpOnly: JavaScript del navegador no puede leerla
 * (protege contra robo de sesión por XSS), y SameSite=Lax bloquea su envío desde otros sitios.
 */
async function setCookie(name: string, value: string, maxAge: number, path = '/') {
  (await cookies()).set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path,
    maxAge,
    priority: 'high',
  });
}

export const setCustomerSession = (jwt: string) => setCookie(CUSTOMER_COOKIE, jwt, SESSION_MAX_AGE);
export const setAdminSession = (jwt: string) => setCookie(ADMIN_COOKIE, jwt, ADMIN_MAX_AGE, '/');

export async function clearCustomerSession() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

async function userFromJwt(jwt: string | undefined): Promise<SessionUser | null> {
  if (!jwt || jwt.length > 2048) return null;
  try {
    const me = await strapi<SessionUser & { blocked?: boolean; confirmed?: boolean }>('/users/me', { auth: { jwt } });
    if (me.blocked) return null;
    return { id: me.id, documentId: me.documentId, username: me.username, email: me.email };
  } catch (error) {
    if (error instanceof StrapiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}

/** Cliente con sesión iniciada (o null). Se memoriza por request con React.cache. */
export const getCustomer = cache(async () => userFromJwt((await cookies()).get(CUSTOMER_COOKIE)?.value));

/**
 * Administrador del dashboard. Además de un JWT válido, el usuario debe tener el rol
 * "Store Admin"; el rol se consulta con el token de servidor (el cliente no puede falsificarlo).
 */
export const getAdmin = cache(async (): Promise<SessionUser | null> => {
  const user = await userFromJwt((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!user) return null;
  const full = await strapi<{ role?: { type: string } }>(`/users/${user.id}`, {
    auth: 'admin',
    query: { populate: { role: { fields: ['type'] } } },
  });
  return full.role?.type === STORE_ADMIN_ROLE ? user : null;
});

/** Usar al inicio de cada página y acción del panel: proxy.ts solo revisa que exista la cookie. */
export async function requireAdmin(): Promise<SessionUser> {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}

export async function isStoreAdmin(userId: number) {
  const full = await strapi<{ role?: { type: string } }>(`/users/${userId}`, {
    auth: 'admin',
    query: { populate: { role: { fields: ['type'] } } },
  });
  return full.role?.type === STORE_ADMIN_ROLE;
}
