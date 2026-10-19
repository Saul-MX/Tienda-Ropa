'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/* Paleta de gráficas: una sola serie por gráfica (azul, slot 1 de la paleta validada). */
const SERIES = '#2a78d6';
const GRID = '#e4e4e0';
const AXIS = '#5f5f63';

type Point = { date: string; revenue: number; orders: number };

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 });
const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

function TooltipBox({ active, payload, label, kind }: { active?: boolean; payload?: { value: number }[]; label?: string; kind: 'revenue' | 'orders' }) {
  if (!active || !payload?.length || !label) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-md border border-line bg-paper px-3 py-2 text-xs shadow-sm">
      <p className="text-muted">{day(label)}</p>
      <p className="mt-0.5 font-semibold text-ink">
        {kind === 'revenue' ? mxn.format(v) : `${v} ${v === 1 ? 'pedido' : 'pedidos'}`}
      </p>
    </div>
  );
}

export function TimeSeriesChart({ data, kind }: { data: Point[]; kind: 'revenue' | 'orders' }) {
  const tickEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {kind === 'revenue' ? (
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES} stopOpacity={0.18} />
                <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tickFormatter={day} interval={tickEvery - 1} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis tickFormatter={(v) => `$${compact.format(v)}`} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={56} />
            <Tooltip content={<TooltipBox kind="revenue" />} cursor={{ stroke: AXIS, strokeDasharray: '3 3' }} />
            <Area type="monotone" dataKey="revenue" stroke={SERIES} strokeWidth={2} fill="url(#revenue-fill)" activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tickFormatter={day} interval={tickEvery - 1} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={32} />
            <Tooltip content={<TooltipBox kind="orders" />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="orders" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
