import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { TimeSeriesChart } from '@/components/admin/charts';
import { BarList, Card, mxn, money, shortDate, StatTile, StatusBadge, statusLabel } from '@/components/admin/ui';
import { getDashboard, ORDER_STATUSES, RANGES, type RangeKey } from '@/lib/admin/data';
import { requireAdmin } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Resumen' };

const RANGE_LABEL: Record<RangeKey, string> = { '7': '7 días', '30': '30 días', '90': '90 días', '365': '12 meses' };
const GENDER_LABEL: Record<string, string> = { hombre: 'Hombre', mujer: 'Mujer', unisex: 'Unisex' };

export default function DashboardPage({ searchParams }: PageProps<'/admin'>) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Cargando métricas…</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<'/admin'>, 'searchParams'>) {
  await requireAdmin();
  const { range: raw } = await searchParams;
  const range: RangeKey = typeof raw === 'string' && raw in RANGES ? (raw as RangeKey) : '30';
  const d = await getDashboard(RANGES[range]);
  const k = d.kpis;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Resumen de ventas</h1>
          <p className="mt-1 text-sm text-muted">
            Montos en MXN. Pedidos en USD convertidos a {d.usdToMxnRate} MXN por dólar.
          </p>
        </div>
        <nav aria-label="Periodo">
          <ul className="flex rounded-full border border-line bg-paper p-1 text-sm">
            {(Object.keys(RANGES) as RangeKey[]).map((key) => (
              <li key={key}>
                <Link
                  href={`/admin?range=${key}`}
                  aria-current={key === range ? 'page' : undefined}
                  className={`block rounded-full px-3 py-1.5 ${key === range ? 'bg-ink text-paper' : 'hover:bg-stone'}`}
                >
                  {RANGE_LABEL[key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Ventas" value={mxn(k.revenue)} change={k.change.revenue} />
        <StatTile label="Pedidos pagados" value={String(k.orders)} change={k.change.orders} />
        <StatTile label="Ticket promedio" value={mxn(k.averageOrderValue)} change={k.change.averageOrderValue} />
        <StatTile label="Prendas vendidas" value={String(k.units)} change={k.change.units} />
        <StatTile label="Clientes nuevos" value={String(k.newCustomers)} change={k.change.newCustomers} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Ventas por día">
          <TimeSeriesChart data={d.series} kind="revenue" />
          <SeriesTable data={d.series} />
        </Card>
        <Card title="Pedidos por día">
          <TimeSeriesChart data={d.series} kind="orders" />
          <SeriesTable data={d.series} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Productos más vendidos" className="lg:col-span-2">
          <BarList rows={d.topProducts} />
        </Card>
        <Card title="Estado de pedidos">
          <ul className="space-y-2.5">
            {ORDER_STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <Link href={`/admin/pedidos?status=${s}`} className="hover:underline">
                  <StatusBadge status={s} />
                </Link>
                <span className="tabular-nums" aria-label={`${statusLabel(s)}: ${d.statusCounts[s] ?? 0}`}>
                  {d.statusCounts[s] ?? 0}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
            {k.activeSubscribers} suscriptores activos al newsletter
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Ventas por categoría">
          <BarList rows={d.byCategory} />
        </Card>
        <Card title="Ventas por género">
          <BarList rows={d.byGender.map((r) => ({ ...r, name: GENDER_LABEL[r.name] ?? r.name }))} />
        </Card>
        <Card title="Ventas por marca">
          <BarList rows={d.byBrand} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="Pedidos recientes"
          className="lg:col-span-2"
          action={<Link href="/admin/pedidos" className="link text-xs">Ver todos</Link>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 pr-4 font-medium">Pedido</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Cliente</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Estado</th>
                  <th scope="col" className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {d.recentOrders.map((o) => (
                  <tr key={o.documentId} className="border-b border-line/60 last:border-0">
                    <td className="py-2.5 pr-4">
                      <Link href={`/admin/pedidos/${o.documentId}`} className="font-medium hover:underline">
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs text-muted">{shortDate(o.createdAt)}</p>
                    </td>
                    <td className="max-w-48 truncate py-2.5 pr-4 text-muted">{o.email ?? '—'}</td>
                    <td className="py-2.5 pr-4"><StatusBadge status={o.status} /></td>
                    <td className="py-2.5 text-right tabular-nums">{money(Number(o.total), o.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {d.recentOrders.length === 0 && <p className="py-6 text-center text-sm text-muted">Aún no hay pedidos.</p>}
          </div>
        </Card>
        <Card title="Mejores clientes">
          {d.topCustomers.length === 0 ? (
            <p className="text-sm text-muted">Sin compras en este periodo.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              {d.topCustomers.map((c) => (
                <li key={c.email} className="flex justify-between gap-3">
                  <span className="truncate">{c.email}</span>
                  <span className="shrink-0 tabular-nums">
                    {mxn(c.revenue)} <span className="text-muted">· {c.orders}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card
        title={`Inventario bajo (≤ ${d.lowStock.threshold} piezas)`}
        action={<Link href="/admin/inventario" className="link text-xs">Ver inventario</Link>}
      >
        {d.lowStock.variants.length === 0 ? (
          <p className="text-sm text-muted">Todo el inventario está por encima del mínimo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 pr-4 font-medium">Producto</th>
                  <th scope="col" className="py-2 pr-4 font-medium">SKU</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Variante</th>
                  <th scope="col" className="py-2 text-right font-medium">Piezas</th>
                </tr>
              </thead>
              <tbody>
                {d.lowStock.variants.map((v) => (
                  <tr key={v.sku} className="border-b border-line/60 last:border-0">
                    <td className="py-2 pr-4">{v.productName}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-muted">{v.sku}</td>
                    <td className="py-2 pr-4 text-muted">{[v.color, v.size].filter(Boolean).join(' / ')}</td>
                    <td className={`py-2 text-right font-semibold tabular-nums ${v.stock === 0 ? 'text-signal' : ''}`}>
                      {v.stock === 0 ? 'Agotado' : v.stock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/** Vista de tabla de la serie (accesible para lectores de pantalla y para revisar cifras exactas). */
function SeriesTable({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  return (
    <details className="mt-3 text-xs">
      <summary className="cursor-pointer text-muted">Ver como tabla</summary>
      <div className="mt-2 max-h-56 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-paper text-muted">
            <tr>
              <th scope="col" className="py-1 font-medium">Fecha</th>
              <th scope="col" className="py-1 text-right font-medium">Pedidos</th>
              <th scope="col" className="py-1 text-right font-medium">Ventas</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.date} className="border-t border-line/60">
                <td className="py-1">{p.date}</td>
                <td className="py-1 text-right tabular-nums">{p.orders}</td>
                <td className="py-1 text-right tabular-nums">{mxn(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
