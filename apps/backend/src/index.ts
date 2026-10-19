import type { Core } from '@strapi/strapi';
import { seedDemoData } from './seed';

export const STORE_ADMIN_ROLE = 'store-admin';

/** Rol de users-permissions para quien entra al dashboard de Next.js (/admin). */
async function ensureStoreAdminRole(strapi: Core.Strapi) {
  const roles = strapi.db.query('plugin::users-permissions.role');
  let role = await roles.findOne({ where: { type: STORE_ADMIN_ROLE } });

  if (!role) {
    role = await roles.create({
      data: {
        name: 'Store Admin',
        description: 'Acceso al dashboard de la tienda. Asígnalo solo a administradores.',
        type: STORE_ADMIN_ROLE,
      },
    });
    strapi.log.info('Rol "Store Admin" creado');
  }

  const permissions = strapi.db.query('plugin::users-permissions.permission');
  const action = 'plugin::users-permissions.user.me';
  const existing = await permissions.findOne({ where: { action, role: role.id } });
  if (!existing) await permissions.create({ data: { action, role: role.id } });
}

/**
 * El rol público no lee nada: la tienda consulta Strapi desde el servidor con un API token.
 * Si alguien activó permisos de lectura/escritura por error en el panel, aquí se revierten
 * para las colecciones sensibles.
 */
async function lockDownPublicRole(strapi: Core.Strapi) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  if (!publicRole) return;

  const sensitive = ['api::order.', 'api::newsletter-subscriber.', 'api::review.', 'api::store.'];
  const permissions = await strapi.db
    .query('plugin::users-permissions.permission')
    .findMany({ where: { role: publicRole.id } });

  for (const permission of permissions) {
    if (sensitive.some((prefix) => permission.action.startsWith(prefix))) {
      await strapi.db.query('plugin::users-permissions.permission').delete({ where: { id: permission.id } });
      strapi.log.warn(`Permiso público eliminado: ${permission.action}`);
    }
  }
}

async function ensureStoreSettings(strapi: Core.Strapi) {
  const settings = await strapi.documents('api::store-setting.store-setting').findFirst();
  if (settings) return;

  await strapi.documents('api::store-setting.store-setting').create({
    data: {
      announcement: 'Envío gratis en compras mayores a $1,999 MXN',
      announcementEn: 'Free shipping on orders over $120 USD',
      heroTitle: 'Lo esencial, bien hecho.',
      heroTitleEn: 'The essentials, done right.',
      heroSubtitle: 'Prendas de marca para hombre y mujer. Diseño atemporal, materiales nobles.',
      heroSubtitleEn: 'Designer clothing for men and women. Timeless design, honest materials.',
      freeShippingMinMxn: 1999,
      freeShippingMinUsd: 120,
      shippingCostMxn: 199,
      shippingCostUsd: 12,
      lowStockThreshold: 3,
    },
  });
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureStoreAdminRole(strapi);
    await lockDownPublicRole(strapi);
    await ensureStoreSettings(strapi);

    if (process.env.SEED_DEMO_DATA === 'true') await seedDemoData(strapi);
  },
};
