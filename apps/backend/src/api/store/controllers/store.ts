import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';

const MAX_RANGE_DAYS = 366;
const DOCUMENT_ID = /^[a-z0-9]{10,40}$/i;

function parseDate(value: unknown, fallback: Date): Date {
  if (typeof value !== 'string') return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async dashboard(ctx: Context) {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 29 * 86_400_000);
    const to = parseDate(ctx.query.to, now);
    const from = parseDate(ctx.query.from, defaultFrom);

    if (from > to) return ctx.badRequest('`from` debe ser anterior a `to`');
    if ((to.getTime() - from.getTime()) / 86_400_000 > MAX_RANGE_DAYS) {
      return ctx.badRequest(`El rango máximo es de ${MAX_RANGE_DAYS} días`);
    }

    ctx.body = await strapi.service('api::store.store').dashboard(from, to);
  },

  async applyStock(ctx: Context) {
    const { documentId } = ctx.params;
    if (!DOCUMENT_ID.test(documentId)) return ctx.badRequest('documentId inválido');

    const result = await strapi.service('api::store.store').applyStock(documentId);
    if (!result) return ctx.notFound('Pedido no encontrado');
    ctx.body = result;
  },
});
