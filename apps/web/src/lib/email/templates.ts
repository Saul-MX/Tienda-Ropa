import 'server-only';
import { formatMoney } from '@/lib/format';
import type { Locale } from '@/lib/i18n/config';
import { localizePath } from '@/lib/i18n/routes';
import { absoluteUrl } from '@/lib/site';
import type { Order } from '@/lib/strapi/types';

/** Todo lo que viene de Strapi o del cliente se escapa antes de entrar al HTML del correo. */
const esc = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function layout(title: string, body: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#ececea;font-family:Helvetica,Arial,sans-serif;color:#000">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff">
      <tr><td style="padding:28px 32px;border-bottom:1px solid #d9d9d5;font-size:26px;font-weight:800;letter-spacing:-0.5px">SAULDT</td></tr>
      <tr><td style="padding:32px">${body}</td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #d9d9d5;font-size:12px;color:#5f5f63">SauldT · ${esc(absoluteUrl('/'))}</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

const copy = {
  es: {
    confirmSubject: (n: string) => `Confirmamos tu pedido ${n}`,
    confirmTitle: 'Gracias por tu compra',
    confirmIntro: 'Recibimos tu pago. Te avisaremos en cuanto tu pedido salga de nuestro almacén.',
    shippedSubject: (n: string) => `Tu pedido ${n} va en camino`,
    shippedTitle: 'Tu pedido va en camino',
    tracking: 'Número de guía',
    carrier: 'Paquetería',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    total: 'Total',
    free: 'Gratis',
    shipTo: 'Enviar a',
    viewAccount: 'Ver mis pedidos',
    welcomeSubject: 'Bienvenido a SauldT',
    welcomeBody: 'Ya estás en la lista. Serás de los primeros en conocer lanzamientos, colecciones y rebajas.',
    newOrderSubject: (n: string) => `Nuevo pedido ${n}`,
  },
  en: {
    confirmSubject: (n: string) => `Your order ${n} is confirmed`,
    confirmTitle: 'Thank you for your order',
    confirmIntro: 'We received your payment. We will let you know as soon as your order ships.',
    shippedSubject: (n: string) => `Your order ${n} is on its way`,
    shippedTitle: 'Your order is on its way',
    tracking: 'Tracking number',
    carrier: 'Carrier',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    total: 'Total',
    free: 'Free',
    shipTo: 'Ship to',
    viewAccount: 'View my orders',
    welcomeSubject: 'Welcome to SauldT',
    welcomeBody: "You're on the list. You'll be among the first to hear about drops, collections and sales.",
    newOrderSubject: (n: string) => `New order ${n}`,
  },
};

function itemsTable(order: Order, locale: Locale) {
  const c = copy[locale];
  const money = (n: number) => esc(formatMoney(Number(n), order.currency, locale));
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #ececea;font-size:14px">
          <strong>${esc(i.productName)}</strong><br>
          <span style="color:#5f5f63">${esc([i.colorName, i.size].filter(Boolean).join(' / '))} · ×${esc(i.quantity)}</span>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #ececea;font-size:14px">${money(i.unitPrice * i.quantity)}</td>
      </tr>`,
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">${rows}
    <tr><td style="padding-top:12px;font-size:14px">${c.subtotal}</td><td align="right" style="padding-top:12px;font-size:14px">${money(order.subtotal)}</td></tr>
    <tr><td style="font-size:14px">${c.shipping}</td><td align="right" style="font-size:14px">${Number(order.shippingCost) === 0 ? c.free : money(order.shippingCost)}</td></tr>
    <tr><td style="padding-top:8px;font-size:16px"><strong>${c.total}</strong></td><td align="right" style="padding-top:8px;font-size:16px"><strong>${money(order.total)}</strong></td></tr>
  </table>`;
}

function addressBlock(order: Order, locale: Locale) {
  const a = order.shippingAddress;
  if (!a?.line1) return '';
  const lines = [a.name, a.line1, a.line2, [a.postalCode, a.city].filter(Boolean).join(' '), [a.state, a.country].filter(Boolean).join(', ')]
    .filter(Boolean)
    .map(esc)
    .join('<br>');
  return `<p style="font-size:14px;line-height:1.5"><strong>${copy[locale].shipTo}</strong><br>${lines}</p>`;
}

const button = (href: string, label: string) =>
  `<p style="margin-top:28px"><a href="${esc(href)}" style="display:inline-block;background:#000;color:#fff;padding:14px 24px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600">${esc(label)}</a></p>`;

export function orderConfirmationEmail(order: Order) {
  const locale: Locale = order.locale === 'en' ? 'en' : 'es';
  const c = copy[locale];
  return {
    subject: c.confirmSubject(order.orderNumber),
    html: layout(
      c.confirmTitle,
      `<h1 style="font-size:24px;margin:0 0 8px">${c.confirmTitle}</h1>
       <p style="font-size:15px;line-height:1.5;margin:0;color:#5f5f63">${c.confirmIntro}</p>
       <p style="font-size:14px;margin:20px 0 0"><strong>${esc(order.orderNumber)}</strong></p>
       ${itemsTable(order, locale)}
       ${addressBlock(order, locale)}
       ${button(absoluteUrl(localizePath(locale, '/cuenta')), c.viewAccount)}`,
    ),
  };
}

export function orderShippedEmail(order: Order) {
  const locale: Locale = order.locale === 'en' ? 'en' : 'es';
  const c = copy[locale];
  return {
    subject: c.shippedSubject(order.orderNumber),
    html: layout(
      c.shippedTitle,
      `<h1 style="font-size:24px;margin:0 0 16px">${c.shippedTitle}</h1>
       <p style="font-size:15px;line-height:1.6">
         <strong>${esc(order.orderNumber)}</strong><br>
         ${order.carrier ? `${c.carrier}: ${esc(order.carrier)}<br>` : ''}
         ${order.trackingNumber ? `${c.tracking}: <strong>${esc(order.trackingNumber)}</strong>` : ''}
       </p>
       ${addressBlock(order, locale)}
       ${button(absoluteUrl(localizePath(locale, '/cuenta')), c.viewAccount)}`,
    ),
  };
}

export function welcomeEmail(locale: Locale) {
  const c = copy[locale];
  return {
    subject: c.welcomeSubject,
    html: layout(
      c.welcomeSubject,
      `<h1 style="font-size:24px;margin:0 0 12px">${c.welcomeSubject}</h1>
       <p style="font-size:15px;line-height:1.6;color:#5f5f63">${c.welcomeBody}</p>
       ${button(absoluteUrl(localizePath(locale, '/')), 'SauldT')}`,
    ),
  };
}

export function adminNewOrderEmail(order: Order) {
  return {
    subject: copy.es.newOrderSubject(order.orderNumber),
    html: layout(
      'Nuevo pedido',
      `<h1 style="font-size:22px;margin:0 0 8px">Nuevo pedido ${esc(order.orderNumber)}</h1>
       <p style="font-size:14px;color:#5f5f63">${esc(order.email)}</p>
       ${itemsTable(order, 'es')}
       ${button(absoluteUrl(`/admin/pedidos/${order.documentId}`), 'Abrir en el dashboard')}`,
    ),
  };
}
