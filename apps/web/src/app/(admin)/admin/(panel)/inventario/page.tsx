import type { Metadata } from 'next';
import { Suspense } from 'react';
import { listInventory } from '@/lib/admin/data';
import { requireAdmin } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Inventario' };

export default function InventoryPage({ searchParams }: PageProps<'/admin/inventario'>) {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">Inventario</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Para editar precios, fotos, tallas o piezas, abre el producto en Strapi. Las existencias bajan solas con cada venta pagada.
      </p>
      <Suspense fallback={<p className="text-sm text-muted">Cargando inventario…</p>}>
        <Inventory searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Inventory({ searchParams }: Pick<PageProps<'/admin/inventario'>, 'searchParams'>) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 60) : undefined;
  const { data } = await listInventory(q);
  const panel = process.env.NEXT_PUBLIC_STRAPI_PANEL_URL;

  return (
    <>
      <form method="get" role="search" className="mb-4 flex gap-2">
        <label htmlFor="inv-q" className="sr-only">Buscar producto o SKU</label>
        <input id="inv-q" name="q" defaultValue={q} placeholder="Producto o SKU" maxLength={60} className="field min-h-10 w-64 rounded-full py-2 text-sm" />
        <button className="btn btn-primary min-h-10">Buscar</button>
      </form>

      <div className="space-y-4">
        {data.map((p) => {
          const total = p.variants.reduce((s, v) => s + v.stock, 0);
          return (
            <section key={p.documentId} className="rounded-lg border border-line bg-paper p-5" aria-labelledby={`p-${p.documentId}`}>
              <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 id={`p-${p.documentId}`} className="font-semibold">
                  {p.name} {!p.active && <span className="ml-2 rounded-full bg-stone px-2 py-0.5 text-xs font-normal text-muted">Oculto</span>}
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted">{total} piezas en total</span>
                  {panel && (
                    <a
                      className="link"
                      href={`${panel}/content-manager/collection-types/api::product.product/${p.documentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Editar en Strapi
                    </a>
                  )}
                </div>
              </header>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {p.variants.map((v) => (
                  <li
                    key={v.sku}
                    className={`rounded-md border px-3 py-2 text-xs ${v.stock === 0 ? 'border-signal' : v.stock <= 3 ? 'border-[#c98500]' : 'border-line'}`}
                  >
                    <p className="flex items-center gap-1.5 font-medium">
                      {v.color && <span className="size-2.5 rounded-full ring-1 ring-line" style={{ backgroundColor: v.color.hex }} aria-hidden="true" />}
                      {v.color?.name} / {v.size}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted">{v.sku}</p>
                    <p className={`mt-1 text-sm font-semibold tabular-nums ${v.stock === 0 ? 'text-signal' : ''}`}>
                      {v.stock === 0 ? 'Agotado' : `${v.stock} pzs`}
                      {v.stock > 0 && v.stock <= 3 && <span className="ml-1 text-xs font-normal text-muted">(bajo)</span>}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {data.length === 0 && <p className="text-sm text-muted">No hay productos con esa búsqueda.</p>}
      </div>
    </>
  );
}
