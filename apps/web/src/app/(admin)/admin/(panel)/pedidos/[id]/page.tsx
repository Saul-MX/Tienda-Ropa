import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { OrderStatusForm } from '@/components/admin/order-status-form';
import { Card, money, shortDate, StatusBadge } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/auth/session';
import { getOrder } from '@/lib/orders';

export const metadata: Metadata = { title: 'Pedido' };

export default function OrderPage({ params }: PageProps<'/admin/pedidos/[id]'>) {
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/pedidos" className="link text-sm">
        Volver a pedidos
      </Link>
      <Suspense fallback={<p className="mt-6 text-sm text-muted">Cargando pedido…</p>}>
        <OrderDetail params={params} />
      </Suspense>
    </div>
  );
}

async function OrderDetail({ params }: Pick<PageProps<'/admin/pedidos/[id]'>, 'params'>) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) notFound();
  const order = await getOrder(id);
  if (!order) notFound();

  const a = order.shippingAddress;
  const timeline = [
    { label: 'Creado', at: order.createdAt },
    { label: 'Pagado', at: order.paidAt },
    { label: 'Enviado', at: order.shippedAt },
    { label: 'Entregado', at: order.deliveredAt },
  ].filter((e) => e.at);

  return (
    <div className="mt-4 space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card title="Artículos">
          <ul className="divide-y divide-line">
            {order.items.map((i) => (
              <li key={i.sku} className="flex justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{i.productName}</p>
                  <p className="text-muted">
                    {[i.brandName, i.colorName, i.size].filter(Boolean).join(' · ')} · <span className="font-mono text-xs">{i.sku}</span>
                  </p>
                </div>
                <p className="shrink-0 text-right tabular-nums">
                  {i.quantity} × {money(Number(i.unitPrice), order.currency)}
                </p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{money(Number(order.subtotal), order.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd className="tabular-nums">{money(Number(order.shippingCost), order.currency)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(Number(order.total), order.currency)}</dd></div>
          </dl>
        </Card>

        <div className="space-y-6">
          <Card title="Actualizar estado">
            <OrderStatusForm
              documentId={order.documentId}
              status={order.status}
              carrier={order.carrier ?? ''}
              trackingNumber={order.trackingNumber ?? ''}
            />
          </Card>
          <Card title="Cliente y envío">
            <p className="text-sm">{order.email ?? '—'}</p>
            {a?.line1 ? (
              <address className="mt-3 text-sm leading-relaxed text-muted not-italic">
                {a.name}<br />
                {a.line1}{a.line2 ? <><br />{a.line2}</> : null}<br />
                {[a.postalCode, a.city].filter(Boolean).join(' ')}<br />
                {[a.state, a.country].filter(Boolean).join(', ')}
                {a.phone && <><br />{a.phone}</>}
              </address>
            ) : (
              <p className="mt-2 text-sm text-muted">Sin dirección (pedido no pagado).</p>
            )}
          </Card>
          <Card title="Historial">
            <ol className="space-y-2 text-sm">
              {timeline.map((e) => (
                <li key={e.label} className="flex justify-between gap-3">
                  <span>{e.label}</span>
                  <time className="text-muted" dateTime={e.at!}>{shortDate(e.at!)}</time>
                </li>
              ))}
            </ol>
            {order.stripePaymentIntentId && (
              <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
                Pago Stripe: <span className="font-mono">{order.stripePaymentIntentId}</span>. Los reembolsos se hacen desde el panel de Stripe y se reflejan aquí solos.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
