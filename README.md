# SauldT — tienda de ropa de marca

Tienda en línea para hombre y mujer con catálogo administrable, pagos con Stripe, correos con Resend y un dashboard de ventas propio.

| Parte | Tecnología | Carpeta |
|---|---|---|
| Tienda + dashboard `/admin` | Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4 | `apps/web` |
| CMS / API (CRUD de ropa) | Strapi 5, TypeScript, SQLite (local) / PostgreSQL (producción) | `apps/backend` |
| Pagos | Stripe Checkout + webhooks firmados | `apps/web/src/lib/actions/cart.ts`, `app/api/webhooks/stripe` |
| Correos | Resend (confirmación, envío, bienvenida, aviso al admin) | `apps/web/src/lib/email` |
| Imágenes | Cloudinary (producción) o `public/uploads` (local) | `apps/backend/config/plugins.ts` |

## Arquitectura

```
Navegador ──► Next.js (Vercel)
               │  - Páginas de la tienda (es / en) y /admin
               │  - Server Actions: carrito, checkout, login, reseñas, newsletter
               │  - /api/webhooks/stripe   ◄── Stripe (firma verificada)
               │  - /api/revalidate        ◄── Strapi (secreto compartido)
               ▼
            Strapi (Railway / Render)  ── PostgreSQL
               - Productos, variantes (talla+color+SKU+stock), marcas, categorías,
                 colecciones, colores, guías de tallas, reseñas, pedidos, newsletter
               - /api/store/dashboard  y  /api/store/orders/:id/apply-stock  (solo token admin)
```

El navegador **nunca** habla con Strapi: todas las consultas salen del servidor de Next.js con API tokens que solo existen en el servidor.

### Catálogo (Strapi)

- **Producto**: nombre/descripción/composición en español e inglés, género (hombre/mujer/unisex), precio MXN y USD, precio de oferta, fotos, marca, categoría, colecciones, sistema de tallas, guía de tallas, etiquetas (Nuevo / Top ventas / Destacado), SEO, visible/oculto.
- **Variantes** (dentro del producto): SKU, talla, color y piezas en inventario. El stock se descuenta solo, por variante, cuando Stripe confirma el pago.
- **Marcas, Categorías, Colecciones** (temporada + año), **Colores** (con hex), **Guías de tallas** (tabla JSON), **Ajustes de la tienda** (aviso superior, hero, envío gratis desde X, costo de envío, alerta de inventario bajo, redes).

### Rutas de la tienda

| Español | Inglés |
|---|---|
| `/es` | `/en` |
| `/es/hombre`, `/es/hombre/camisas` | `/en/men`, `/en/men/camisas` |
| `/es/producto/[slug]` | `/en/product/[slug]` |
| `/es/colecciones/[slug]` | `/en/collections/[slug]` |
| `/es/marcas/[slug]` | `/en/brands/[slug]` |
| `/es/buscar?q=…` (filtros y rebajas) | `/en/search` |
| `/es/carrito`, `/es/cuenta` | `/en/cart`, `/en/account` |

`/es` cobra en **MXN** y `/en` en **USD**. El dashboard está en `/admin`.

## Puesta en marcha local

Requisitos: Node.js 20.9+ (probado con 24), npm, y opcionalmente la [Stripe CLI](https://docs.stripe.com/stripe-cli).

```bash
npm run install:all
```

1. **Arranca Strapi** y crea tu cuenta de administrador de Strapi en http://localhost:1337/admin:

   ```bash
   npm run dev:backend
   ```

   La primera vez carga 8 productos demo (`SEED_DEMO_DATA=true` en `apps/backend/.env`). Cámbialo a `false` cuando cargues tu catálogo real.

2. **Genera los API tokens** (se escriben directo en `apps/web/.env.local`, no se muestran en pantalla):

   ```bash
   npm run tokens
   ```

3. **Crea tu usuario del dashboard**: en Strapi ve a *Content Manager → User* → *Create new entry*, llena correo y contraseña, marca *confirmed* y en *role* elige **Store Admin**. Con ese correo entras a http://localhost:3000/admin.

4. **Stripe (modo prueba)**: copia tu `sk_test_…` en `STRIPE_SECRET_KEY` de `apps/web/.env.local`. En otra terminal:

   ```bash
   npm run stripe:listen
   ```

   Copia el `whsec_…` que imprime en `STRIPE_WEBHOOK_SECRET`. Para pagar usa la tarjeta de prueba `4242 4242 4242 4242`.

5. **Resend (opcional en local)**: pon tu `RESEND_API_KEY`. Sin ella los correos solo se registran en la consola.

6. **Arranca la tienda**:

   ```bash
   npm run dev:web
   ```

   http://localhost:3000

7. **Refresco automático del catálogo**: en Strapi ve a *Settings → Webhooks → Create*, URL `http://localhost:3000/api/revalidate`, header `Authorization: Bearer <REVALIDATE_SECRET>` (el valor está en `apps/web/.env.local`), eventos *Entry: create, update, delete*. Así cada cambio en Strapi se refleja en la tienda en segundos.

## Despliegue

### Strapi (Railway o Render)
- Base de datos PostgreSQL: `DATABASE_CLIENT=postgres`, `DATABASE_URL=…`, `DATABASE_SSL=true`.
- Genera secretos nuevos para `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY` (ver `apps/backend/.env.example`).
- `PUBLIC_URL=https://api.tudominio.com`, `IS_PROXIED=true`, `CORS_ORIGINS=https://tudominio.com`, `SEED_DEMO_DATA=false`.
- Cloudinary: `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`.
- Comandos: build `npm run build`, start `npm run start`. Después corre `node scripts/create-api-tokens.js .env.tokens` en el servidor (o crea los tokens a mano en *Settings → API Tokens*: uno *Read-only* y uno *Full access*).

### Next.js (Vercel)
- Root directory: `apps/web`.
- Variables: todas las de `apps/web/.env.example` con valores de producción (`NEXT_PUBLIC_SITE_URL=https://tudominio.com`, `STRAPI_URL=https://api.tudominio.com`, claves `sk_live_…`).
- En Stripe → *Developers → Webhooks* agrega `https://tudominio.com/api/webhooks/stripe` con los eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, y copia su `whsec_…`.
- En Resend verifica tu dominio y usa un `EMAIL_FROM` de ese dominio.
- Actualiza el webhook de Strapi para que apunte a `https://tudominio.com/api/revalidate`.
- Da de alta el sitemap (`https://tudominio.com/sitemap.xml`) en Google Search Console.

## Seguridad

- **Secretos solo en el servidor**: ninguna clave lleva `NEXT_PUBLIC_`; los módulos con secretos importan `server-only` (falla el build si alguien los importa en el navegador). `.env*` está en `.gitignore`.
- **Archivos privados**: Next.js solo sirve `public/` y las rutas definidas. Además `proxy.ts` responde 404 a cualquier ruta con punto inicial (`/.env`, `/.git`) y a extensiones sensibles (`.sql`, `.bak`, `.log`, `.yml`, `.php`…) o sondeos de WordPress.
- **Precios imposibles de manipular**: el carrito del navegador solo guarda SKU y cantidad. Precio, stock y envío se recalculan en el servidor al ver el carrito y al pagar; el webhook compara el monto cobrado con el del pedido.
- **Pagos**: un pedido solo pasa a "pagado" con un webhook de Stripe con firma válida. La página de éxito solo muestra información. Los datos de tarjeta nunca tocan tu servidor (Stripe Checkout).
- **Inventario atómico e idempotente**: el descuento ocurre en una transacción con `UPDATE … WHERE stock >= cantidad` y una marca `stockApplied`, así que webhooks duplicados no descuentan dos veces.
- **Sesiones**: el JWT de Strapi vive en una cookie `httpOnly`, `Secure` (producción) y `SameSite=Lax`; JavaScript no puede leerla.
- **Dashboard**: `proxy.ts` bloquea `/admin` sin cookie y **cada página y acción** vuelve a verificar en el servidor que el usuario tenga el rol *Store Admin* (consultado con el token del servidor, no con datos del cliente). El login no revela si un correo existe o si es admin.
- **Permisos en Strapi**: el rol público no tiene acceso a pedidos, reseñas, newsletter ni a la API del dashboard (el arranque de Strapi revierte esos permisos si alguien los activa). El token de lectura no puede escribir; las rutas `/api/store/*` exigen el token de acceso total. El registro de clientes ignora campos como `role`.
- **Validación**: todo lo que llega del navegador (formularios, filtros de la URL, carrito) pasa por Zod antes de llegar a Strapi.
- **Fuerza bruta y spam**: límites por IP en login (además del límite propio de Strapi), registro, newsletter, reseñas y checkout; campo trampa contra bots en el newsletter; las reseñas entran sin aprobar.
- **Headers**: CSP (sin `frame`, `object` ni orígenes externos salvo Cloudinary y Stripe Checkout), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, sin `X-Powered-By`. Strapi tiene su propia CSP, CORS restringido al dominio de la tienda y límite de tamaño de peticiones.
- **XSS**: React escapa el contenido; el JSON-LD escapa `<`; los correos escapan todo dato dinámico; el CSV exportado neutraliza fórmulas de Excel.

Pendiente para producción: el límite por IP es en memoria (por instancia). Para un límite global entre instancias de Vercel cambia `src/lib/security/rate-limit.ts` a Upstash Redis.

## SEO

- HTML semántico (`header`, `nav`, `main`, `article`, `section`, `aside`, `footer`, breadcrumbs con `aria-current`, un solo `h1` por página, tablas con `th scope`).
- `metadata` por página: título, descripción, canonical, `hreflang` es-MX / en-US / x-default, Open Graph y Twitter. Cada producto, categoría, colección y marca permite sobrescribir título, descripción e imagen desde el componente SEO de Strapi.
- URLs traducidas en inglés (`/en/men`, `/en/product/…`) con redirecciones 308 para que cada página tenga una sola URL por idioma.
- Datos estructurados JSON-LD: `ClothingStore`, `WebSite` con buscador, `Product` con `Offer` y `AggregateRating`, `BreadcrumbList`.
- `sitemap.xml` con alternativas por idioma y `robots.txt` que excluye carrito, cuenta, checkout, búsqueda y admin.
- Rendimiento: páginas prerenderizadas (Cache Components), imágenes AVIF/WebP con `next/image`, fuente Archivo autoalojada con `next/font`, filtros que funcionan sin JavaScript.

## Diseño

Blanco de galería, gris piedra frío detrás de cada foto, negro puro para el texto y rojo solo para rebajas y errores. Una sola familia tipográfica (Archivo): la versión expandida es el logotipo y los titulares, la normal es para leer. Las cards de producto siguen el estilo Bape: foto grande sobre gris, etiquetas rectangulares (Nuevo, -20 %, Top ventas, Agotado), segunda foto al pasar el cursor y muestras de color.

## Comandos útiles

```bash
npm run typecheck     # TypeScript en web y backend
npm run lint          # ESLint de la tienda
npm run build:web     # build de producción de Next.js (requiere Strapi encendido)
```
