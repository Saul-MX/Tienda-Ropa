import 'server-only';
import qs from 'qs';
import { env } from '@/lib/env';

export class StrapiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

type Options = {
  query?: Record<string, unknown>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /**
   * read: token de solo lectura (catálogo). admin: token de acceso total (pedidos, inventario).
   * user: JWT del cliente que inició sesión (endpoints de autenticación).
   */
  auth?: 'read' | 'admin' | { jwt: string } | 'none';
};

export async function strapi<T>(path: string, { query, method = 'GET', body, auth = 'read' }: Options = {}): Promise<T> {
  const { STRAPI_URL, STRAPI_READ_TOKEN, STRAPI_ADMIN_TOKEN } = env();
  const search = query ? `?${qs.stringify(query, { encodeValuesOnly: true })}` : '';

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth === 'read') headers.Authorization = `Bearer ${STRAPI_READ_TOKEN}`;
  else if (auth === 'admin') headers.Authorization = `Bearer ${STRAPI_ADMIN_TOKEN}`;
  else if (typeof auth === 'object') headers.Authorization = `Bearer ${auth.jwt}`;

  const res = await fetch(`${STRAPI_URL}/api${path}${search}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    // Nunca se reenvía el error crudo de Strapi al navegador; solo se registra en el servidor.
    throw new StrapiError(res.status, payload?.error?.message ?? res.statusText, payload?.error?.details);
  }

  return (res.status === 204 ? null : await res.json()) as T;
}

/** Las imágenes locales de Strapi vienen como "/uploads/…"; las de Cloudinary ya son absolutas. */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${process.env.STRAPI_URL ?? 'http://localhost:1337'}${url}`;
}
