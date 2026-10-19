'use client';

import { useActionState } from 'react';
import { updateOrderStatus, type AdminActionState } from '@/lib/actions/admin';
import type { OrderStatus } from '@/lib/strapi/types';

const OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'paid', label: 'Pagado (por preparar)' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
];

type Props = { documentId: string; status: OrderStatus; carrier: string; trackingNumber: string };

export function OrderStatusForm({ documentId, status, carrier, trackingNumber }: Props) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(updateOrderStatus, {});
  const locked = status === 'pending' || status === 'refunded';

  if (locked) {
    return (
      <p className="text-sm text-muted">
        {status === 'pending' ? 'Esperando confirmación de pago de Stripe.' : 'Pedido reembolsado.'}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3 text-sm">
      <input type="hidden" name="documentId" value={documentId} />
      <label className="block">
        Estado
        <select name="status" defaultValue={status} className="field mt-1 min-h-10 py-2 text-sm">
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Paquetería
        <input name="carrier" defaultValue={carrier} maxLength={60} placeholder="DHL, Estafeta, FedEx…" className="field mt-1 min-h-10 py-2 text-sm" />
      </label>
      <label className="block">
        Número de guía
        <input name="trackingNumber" defaultValue={trackingNumber} maxLength={80} pattern="[A-Za-z0-9 \-]*" className="field mt-1 min-h-10 py-2 text-sm" />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="notify" defaultChecked className="size-4 accent-ink" />
        Enviar correo al cliente al marcar como enviado
      </label>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        Guardar cambios
      </button>
      {state.ok && <p role="status" className="text-ok">Cambios guardados.</p>}
      {state.error && <p role="alert" className="text-signal">{state.error}</p>}
    </form>
  );
}
