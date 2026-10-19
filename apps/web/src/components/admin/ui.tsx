import type { OrderStatus } from '@/lib/strapi/types';

export const mxn = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export const money = (n: number, currency: 'mxn' | 'usd') =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 2 }).format(n);

export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' }).format(new Date(iso));

export function Card({ title, children, className = '', action }: { title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={`rounded-lg border border-line bg-paper p-5 ${className}`} aria-label={title}>
      <header className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Tarjeta de KPI: número protagonista, comparación con el periodo anterior con flecha + texto (no solo color). */
export function StatTile({ label, value, change }: { label: string; value: string; change: number | null }) {
  const up = change !== null && change > 0;
  const down = change !== null && change < 0;
  return (
    <div className="rounded-lg border border-line bg-paper p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className={`mt-1 text-xs ${up ? 'text-ok' : down ? 'text-signal' : 'text-muted'}`}>
        {change === null ? 'Sin datos previos' : (
          <>
            <span aria-hidden="true">{up ? '▲' : down ? '▼' : '■'}</span> {Math.abs(change)}%{' '}
            <span className="text-muted">vs. periodo anterior</span>
          </>
        )}
      </p>
    </div>
  );
}

/** Barras horizontales en HTML: magnitud en un solo tono, valores escritos (no solo la barra). */
export function BarList({ rows, valueLabel = (r) => mxn(r.revenue) }: { rows: { name: string; units: number; revenue: number }[]; valueLabel?: (r: { units: number; revenue: number }) => string }) {
  if (!rows.length) return <p className="text-sm text-muted">Sin ventas en este periodo.</p>;
  const max = Math.max(...rows.map((r) => r.revenue), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.name} className="group" title={`${r.name}: ${r.units} uds · ${mxn(r.revenue)}`}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate">{r.name}</span>
            <span className="shrink-0 tabular-nums">
              {valueLabel(r)} <span className="text-muted">· {r.units} uds</span>
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-[#eeeeec]">
            <div className="h-2 rounded-full bg-[#2a78d6] group-hover:bg-[#256abf]" style={{ width: `${Math.max(2, (r.revenue / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const STATUS: Record<OrderStatus, { label: string; cls: string; icon: string }> = {
  pending: { label: 'Pendiente', cls: 'bg-stone text-muted', icon: '○' },
  paid: { label: 'Pagado', cls: 'bg-[#e6f0fb] text-[#1c5cab]', icon: '●' },
  shipped: { label: 'Enviado', cls: 'bg-[#fff4dc] text-[#7a5200]', icon: '➜' },
  delivered: { label: 'Entregado', cls: 'bg-[#e3f3e3] text-[#1f6f43]', icon: '✓' },
  cancelled: { label: 'Cancelado', cls: 'bg-stone text-muted', icon: '×' },
  refunded: { label: 'Reembolsado', cls: 'bg-[#fbe6e6] text-[#a12a2a]', icon: '↺' },
};

export const statusLabel = (s: OrderStatus) => STATUS[s].label;

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      <span aria-hidden="true">{s.icon}</span>
      {s.label}
    </span>
  );
}
