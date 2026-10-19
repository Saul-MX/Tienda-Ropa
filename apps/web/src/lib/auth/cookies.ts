/** Nombres de cookies compartidos entre proxy.ts y el servidor (no contiene secretos). */
export const CUSTOMER_COOKIE = 'sdt_session';
export const ADMIN_COOKIE = 'sdt_admin';

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // igual que el JWT de Strapi (7 días)
export const ADMIN_MAX_AGE = 60 * 60 * 8; // jornada de trabajo
