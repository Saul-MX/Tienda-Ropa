/**
 * Rutas privadas de la tienda. No tienen `auth: false`, así que Strapi exige
 * un API token con acceso total (solo lo tiene el servidor de Next.js).
 * Ningún rol público o de cliente tiene permiso sobre estas acciones.
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/store/dashboard',
      handler: 'store.dashboard',
    },
    {
      method: 'POST',
      path: '/store/orders/:documentId/apply-stock',
      handler: 'store.applyStock',
    },
  ],
};
