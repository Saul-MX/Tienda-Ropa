import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      jwt: { expiresIn: '7d' },
      // Limita intentos de login/registro por IP para frenar fuerza bruta.
      ratelimit: { interval: 60_000, max: 10 },
      register: { allowedFields: [] },
    },
  },
  // Si hay credenciales de Cloudinary, las imágenes se suben ahí; si no, se guardan en local (solo desarrollo).
  ...(env('CLOUDINARY_NAME')
    ? {
        upload: {
          config: {
            provider: 'cloudinary',
            providerOptions: {
              cloud_name: env('CLOUDINARY_NAME'),
              api_key: env('CLOUDINARY_KEY'),
              api_secret: env('CLOUDINARY_SECRET'),
            },
            actionOptions: {
              upload: { folder: env('CLOUDINARY_FOLDER', 'sauldt') },
              uploadStream: { folder: env('CLOUDINARY_FOLDER', 'sauldt') },
              delete: {},
            },
          },
        },
      }
    : {}),
});

export default config;
