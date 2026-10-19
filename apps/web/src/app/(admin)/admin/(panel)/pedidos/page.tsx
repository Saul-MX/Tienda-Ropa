import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { money, shortDate, StatusBadge, statusLabel } from '@/components/admin/ui';
import { listOrders, ORDER_STATUSES } from '@/lib/admin/data';
import { requireAdmin } from '@/lib/auth/session';
import type { OrderStatus } from '@/lib/strapi/types';

export const metadata: Metadata = { title: 'Pedidos' };

export default function OrdersPage({ searchParams }: PageProps<'/admin/pedidos'>) {
  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-2xl font-semibold">Pedidos</h1>
      <Suspense fallback={<p className="text-sm text-muted">Cargando pedidos…</p>}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Orders({ searchParams }: Pick<PageProps<'/admin/pedidos'>, 'searchParams'>) {
  await requireAdmin();
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const page = Math.min(500, Math.max(1, Number(sp.page) || 1));
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 60) : undefined;

  const { data, meta } = await listOrders({ status, page, q });
  const qs = (overrides: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, q, page, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== '') p.set(k, String(v));
    return `?${p}`;
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filtrar por estado" className="overflow-x-auto">
          <ul className="flex gap-1 text-sm">
            <li>
              <Link href="/admin/pedidos" className={`block rounded-full px-3 py-1.5 ${!status ? 'bg-ink text-paper' : 'bg-paper hover:bg-stone'}`}>
                Todos
              </Link>
            </li>
            {ORDER_STATUSES.map((s) => (
              <li key={s}>
                <Link
                  href={qs({ status: s, page: 1 })}
                  aria-current={status === s ? 'page' : undefined}
                  className={`block rounded-full px-3 py-1.5 whitespace-nowrap ${status === s ? 'bg-ink text-paper' : 'bg-paper hover:bg-stone'}`}
                >
                  {statusLabel(s)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form method="get" role="search" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="order-q" className="sr-only">Buscar pedido</label>
          <input id="order-q" name="q" defaultValue={q} placeholder="Número o correo" maxLength={60} className="field min-h-10 w-56 rounded-full py-2 text-sm" />
          <button className="btn btn-primary min-h-10">Buscar</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="px-4 py-3 font-medium">Pedido</th>
              <th scope="col" className="px-4 py-3 font-medium">Fecha</th>
              <th scope="col" className="px-4 py-3 font-medium">Cliente</th>
              <th scope="col" className="px-4 py-3 font-medium">Prendas</th>
              <th scope="col" className="px-4 py-3 font-medium">Estado</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((o) => (
              <tr key={o.documentId} className="border-b border-line/60 last:border-0 hover:bg-[#fafaf8]">
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${o.documentId}`} className="font-medium hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{shortDate(o.createdAt)}</td>
                <td className="max-w-56 truncate px-4 py-3 text-muted">{o.email ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-right tabular-nums">{money(Number(o.total), o.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="p-8 text-center text-sm text-muted">No hay pedidos con ese filtro.</p>}
      </div>

      {meta.pagination.pageCount > 1 && (
        <nav aria-label="Paginación" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link className="link" href={qs({ page: page - 1 })}>Anterior</Link> : <span />}
          <span className="text-muted">Página {page} de {meta.pagination.pageCount} · {meta.pagination.total} pedidos</span>
          {page < meta.pagination.pageCount ? <Link className="link" href={qs({ page: page + 1 })}>Siguiente</Link> : <span />}
        </nav>
      )}
    </>
  );
}
