/**
 * Crea los dos API tokens que usa la tienda (Next.js) y los guarda directo en un archivo .env
 * sin imprimirlos en la terminal.
 *
 *   node scripts/create-api-tokens.js ../web/.env.local
 *
 * - STRAPI_READ_TOKEN  (read-only):   leer el catálogo.
 * - STRAPI_ADMIN_TOKEN (full-access): pedidos, inventario, reseñas, dashboard. Solo servidor.
 *
 * Si los tokens ya existen no se vuelven a crear (Strapi no puede mostrar un token existente:
 * para regenerarlos, bórralos en Settings > API Tokens y vuelve a correr el script).
 */
const fs = require('node:fs');
const path = require('node:path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const target = process.argv[2];
if (!target) {
  console.error('Uso: node scripts/create-api-tokens.js <ruta del .env destino>');
  process.exit(1);
}

const TOKENS = [
  { env: 'STRAPI_READ_TOKEN', name: 'sauldt-web-read', type: 'read-only', description: 'Next.js: lectura del catálogo' },
  { env: 'STRAPI_ADMIN_TOKEN', name: 'sauldt-web-admin', type: 'full-access', description: 'Next.js (solo servidor): pedidos y dashboard' },
];

function upsertEnv(file, key, value) {
  const content = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  fs.writeFileSync(file, re.test(content) ? content.replace(re, line) : `${content.replace(/\n?$/, '\n')}${line}\n`, { mode: 0o600 });
}

(async () => {
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = 'error';
  const service = app.service('admin::api-token');
  const file = path.resolve(process.cwd(), target);

  for (const t of TOKENS) {
    if (await service.exists({ name: t.name })) {
      console.log(`• ${t.name} ya existe (no se modificó ${t.env})`);
      continue;
    }
    const token = await service.create({ name: t.name, type: t.type, description: t.description, lifespan: null });
    upsertEnv(file, t.env, token.accessKey);
    console.log(`✓ ${t.name} creado → ${t.env} guardado en ${path.basename(file)}`);
  }

  await app.destroy();
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
