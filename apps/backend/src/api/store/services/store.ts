import type { Core } from '@strapi/strapi';

const REVENUE_STATUSES = ['paid', 'shipped', 'delivered'];
const VARIANTS_TABLE = 'components_product_variants';
const DAY = 86_400_000;

type OrderItem = {
  sku: string;
  productDocumentId?: string;
  productName: string;
  brandName?: string;
  categoryName?: string;
  gender?: string;
  size?: string;
  colorName?: string;
  quantity: number;
  unitPrice: number | string;
};

type Order = {
  documentId: string;
  orderNumber: string;
  email?: string;
  status: string;
  currency: 'mxn' | 'usd';
  total: number | string;
  createdAt: string;
  paidAt?: string;
  items?: OrderItem[];
};

/** Todo el dashboard se reporta en MXN; los pedidos en USD se convierten con este tipo de cambio. */
function usdRate() {
  const rate = Number(process.env.USD_TO_MXN_RATE ?? 18);
  return Number.isFinite(rate) && rate > 0 ? rate : 18;
}

const toMxn = (amount: number | string, currency: string) =>
  Number(amount) * (currency === 'usd' ? usdRate() : 1);

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

function addTo(map: Map<string, { units: number; revenue: number }>, key: string, units: number, revenue: number) {
  const row = map.get(key) ?? { units: 0, revenue: 0 };
  row.units += units;
  row.revenue += revenue;
  map.set(key, row);
}

const ranked = (map: Map<string, { units: number; revenue: number }>, limit?: number) =>
  [...map.entries()]
    .map(([name, v]) => ({ name, units: v.units, revenue: Math.round(v.revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

const pctChange = (current: number, previous: number) =>
  previous === 0 ? (current === 0 ? 0 : null) : Math.round(((current - previous) / previous) * 1000) / 10;

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const paidOrdersBetween = (from: Date, to: Date) =>
    strapi.db.query('api::order.order').findMany({
      where: { status: { $in: REVENUE_STATUSES }, paidAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
      populate: ['items'],
    }) as Promise<Order[]>;

  function summarize(orders: Order[]) {
    const revenue = orders.reduce((sum, o) => sum + toMxn(o.total, o.currency), 0);
    const units = orders.reduce((sum, o) => sum + (o.items ?? []).reduce((s, i) => s + i.quantity, 0), 0);
    return {
      revenue: Math.round(revenue * 100) / 100,
      orders: orders.length,
      averageOrderValue: orders.length ? Math.round((revenue / orders.length) * 100) / 100 : 0,
      units,
    };
  }

  return {
    async dashboard(from: Date, to: Date) {
      const span = to.getTime() - from.getTime();
      const prevFrom = new Date(from.getTime() - span - 1);
      const prevTo = new Date(from.getTime() - 1);

      const [orders, previousOrders, allInRange, newCustomers, prevCustomers, subscribers, settings, products, recent] =
        await Promise.all([
          paidOrdersBetween(from, to),
          paidOrdersBetween(prevFrom, prevTo),
          strapi.db.query('api::order.order').findMany({
            where: { createdAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
            select: ['status'],
          }) as Promise<Pick<Order, 'status'>[]>,
          strapi.db.query('plugin::users-permissions.user').count({
            where: { createdAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          }),
          strapi.db.query('plugin::users-permissions.user').count({
            where: { createdAt: { $gte: prevFrom.toISOString(), $lte: prevTo.toISOString() } },
          }),
          strapi.db.query('api::newsletter-subscriber.newsletter-subscriber').count({ where: { active: true } }),
          strapi.db.query('api::store-setting.store-setting').findOne({ select: ['lowStockThreshold'] }),
          strapi.db.query('api::product.product').findMany({
            where: { active: true },
            select: ['documentId', 'name', 'slug'],
            populate: { variants: { populate: { color: { select: ['name'] } } } },
          }),
          strapi.db.query('api::order.order').findMany({
            orderBy: { createdAt: 'desc' },
            limit: 8,
            select: ['documentId', 'orderNumber', 'email', 'status', 'currency', 'total', 'createdAt'],
          }),
        ]);

      // Serie diaria con todos los días del rango (incluye días en cero para que la gráfica sea continua).
      const series = new Map<string, { revenue: number; orders: number }>();
      for (let t = new Date(dayKey(from)).getTime(); t <= to.getTime(); t += DAY) {
        series.set(dayKey(new Date(t)), { revenue: 0, orders: 0 });
      }

      const byProduct = new Map<string, { units: number; revenue: number }>();
      const byCategory = new Map<string, { units: number; revenue: number }>();
      const byGender = new Map<string, { units: number; revenue: number }>();
      const byBrand = new Map<string, { units: number; revenue: number }>();
      const byCustomer = new Map<string, { units: number; revenue: number }>();

      for (const order of orders) {
        const key = dayKey(new Date(order.paidAt ?? order.createdAt));
        const day = series.get(key) ?? { revenue: 0, orders: 0 };
        day.revenue += toMxn(order.total, order.currency);
        day.orders += 1;
        series.set(key, day);

        if (order.email) addTo(byCustomer, order.email, 1, toMxn(order.total, order.currency));

        for (const item of order.items ?? []) {
          const revenue = toMxn(Number(item.unitPrice) * item.quantity, order.currency);
          addTo(byProduct, item.productName, item.quantity, revenue);
          addTo(byCategory, item.categoryName || 'Sin categoría', item.quantity, revenue);
          addTo(byGender, item.gender || 'unisex', item.quantity, revenue);
          addTo(byBrand, item.brandName || 'Sin marca', item.quantity, revenue);
        }
      }

      const statusCounts: Record<string, number> = {
        pending: 0, paid: 0, shipped: 0, delivered: 0, cancelled: 0, refunded: 0,
      };
      for (const o of allInRange) statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;

      const threshold = settings?.lowStockThreshold ?? 3;
      const lowStock = products
        .flatMap((p: any) =>
          (p.variants ?? []).map((v: any) => ({
            productDocumentId: p.documentId,
            productName: p.name,
            sku: v.sku,
            size: v.size,
            color: v.color?.name ?? null,
            stock: v.stock,
          })),
        )
        .filter((v) => v.stock <= threshold)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 25);

      const current = summarize(orders);
      const previous = summarize(previousOrders);

      return {
        range: { from: from.toISOString(), to: to.toISOString() },
        currency: 'mxn',
        usdToMxnRate: usdRate(),
        kpis: {
          ...current,
          newCustomers,
          activeSubscribers: subscribers,
          change: {
            revenue: pctChange(current.revenue, previous.revenue),
            orders: pctChange(current.orders, previous.orders),
            averageOrderValue: pctChange(current.averageOrderValue, previous.averageOrderValue),
            units: pctChange(current.units, previous.units),
            newCustomers: pctChange(newCustomers, prevCustomers),
          },
        },
        series: [...series.entries()].map(([date, v]) => ({
          date,
          revenue: Math.round(v.revenue * 100) / 100,
          orders: v.orders,
        })),
        topProducts: ranked(byProduct, 10),
        byCategory: ranked(byCategory),
        byGender: ranked(byGender),
        byBrand: ranked(byBrand),
        topCustomers: ranked(byCustomer, 5).map(({ name, units, revenue }) => ({ email: name, orders: units, revenue })),
        statusCounts,
        lowStock: { threshold, variants: lowStock },
        recentOrders: recent,
      };
    },

    /**
     * Descuenta el inventario de un pedido pagado. Es idempotente (marca `stockApplied`)
     * y atómico: todo ocurre en una transacción y cada descuento es un UPDATE condicional.
     */
    async applyStock(documentId: string) {
      const found = (await strapi.db.query('api::order.order').findOne({
        where: { documentId },
        populate: ['items'],
      })) as (Order & { id: number }) | null;
      if (!found) return null;
      const items = found.items ?? [];

      return strapi.db.connection.transaction(async (trx) => {
        // UPDATE condicional: si dos webhooks llegan a la vez, solo uno "gana" y descuenta.
        const claimed = await trx('orders')
          .where({ id: found.id })
          .andWhere((q) => q.where('stock_applied', false).orWhereNull('stock_applied'))
          .update({ stock_applied: true });
        if (!claimed) return { applied: false, reason: 'already-applied', shortages: [] };

        const shortages: { sku: string; requested: number; available: number }[] = [];

        for (const item of items) {
          const updated = await trx(VARIANTS_TABLE)
            .where({ sku: item.sku })
            .andWhere('stock', '>=', item.quantity)
            .decrement('stock', item.quantity);

          if (!updated) {
            // No alcanzó el inventario: se deja en 0 y se reporta para que el admin lo resuelva.
            const row = await trx(VARIANTS_TABLE).where({ sku: item.sku }).first('stock');
            shortages.push({ sku: item.sku, requested: item.quantity, available: row?.stock ?? 0 });
            await trx(VARIANTS_TABLE).where({ sku: item.sku }).update({ stock: 0 });
          }
        }

        if (shortages.length) strapi.log.warn(`Pedido ${documentId} con faltantes: ${JSON.stringify(shortages)}`);
        return { applied: true, shortages };
      });
    },
  };
};
