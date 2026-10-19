import 'server-only';
import { strapi } from '@/lib/strapi/client';
import type { ListResponse, Order, OrderStatus } from '@/lib/strapi/types';

export type Ranked = { name: string; units: number; revenue: number };

export type DashboardData = {
  range: { from: string; to: string };
  currency: 'mxn';
  usdToMxnRate: number;
  kpis: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
    units: number;
    newCustomers: number;
    activeSubscribers: number;
    change: Record<'revenue' | 'orders' | 'averageOrderValue' | 'units' | 'newCustomers', number | null>;
  };
  series: { date: string; revenue: number; orders: number }[];
  topProducts: Ranked[];
  byCategory: Ranked[];
  byGender: Ranked[];
  byBrand: Ranked[];
  topCustomers: { email: string; orders: number; revenue: number }[];
  statusCounts: Record<OrderStatus, number>;
  lowStock: {
    threshold: number;
    variants: { productDocumentId: string; productName: string; sku: string; size: string; color: string | null; stock: number }[];
  };
  recentOrders: Pick<Order, 'documentId' | 'orderNumber' | 'email' | 'status' | 'currency' | 'total' | 'createdAt'>[];
};

export const RANGES = { '7': 7, '30': 30, '90': 90, '365': 365 } as const;
export type RangeKey = keyof typeof RANGES;

export async function getDashboard(days: number): Promise<DashboardData> {
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 86_400_000);
  from.setUTCHours(0, 0, 0, 0);
  return strapi<DashboardData>('/store/dashboard', {
    auth: 'admin',
    query: { from: from.toISOString(), to: to.toISOString() },
  });
}

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];

export async function listOrders({ status, page, q }: { status?: OrderStatus; page: number; q?: string }) {
  const filters: Record<string, unknown> = {};
  if (status) filters.status = { $eq: status };
  if (q) filters.$or = [{ orderNumber: { $containsi: q } }, { email: { $containsi: q } }];
  return strapi<ListResponse<Order>>('/orders', {
    auth: 'admin',
    query: { filters, sort: ['createdAt:desc'], populate: { items: true }, pagination: { page, pageSize: 25 } },
  });
}

export type AdminReview = {
  documentId: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  approved: boolean;
  createdAt: string;
  product: { name: string; slug: string } | null;
};

export async function listReviews(approved: boolean) {
  return strapi<ListResponse<AdminReview>>('/reviews', {
    auth: 'admin',
    query: {
      filters: { approved: { $eq: approved } },
      populate: { product: { fields: ['name', 'slug'] } },
      sort: ['createdAt:desc'],
      pagination: { pageSize: 50 },
    },
  });
}

export type Subscriber = { documentId: string; email: string; locale: string; active: boolean; createdAt: string };

export async function listSubscribers(page = 1, pageSize = 50) {
  return strapi<ListResponse<Subscriber>>('/newsletter-subscribers', {
    auth: 'admin',
    query: { sort: ['createdAt:desc'], pagination: { page, pageSize } },
  });
}

export type InventoryRow = {
  documentId: string;
  name: string;
  slug: string;
  active: boolean;
  variants: { sku: string; size: string; stock: number; color: { name: string; hex: string } | null }[];
};

export async function listInventory(q?: string) {
  return strapi<ListResponse<InventoryRow>>('/products', {
    auth: 'admin',
    query: {
      filters: q ? { $or: [{ name: { $containsi: q } }, { variants: { sku: { $containsi: q } } }] } : {},
      fields: ['name', 'slug', 'active'],
      populate: { variants: { populate: { color: { fields: ['name', 'hex'] } } } },
      sort: ['name:asc'],
      pagination: { pageSize: 100 },
    },
  });
}
