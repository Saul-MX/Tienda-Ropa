import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { shortDate } from '@/components/admin/ui';
import { moderateReview } from '@/lib/actions/admin';
import { listReviews } from '@/lib/admin/data';
import { requireAdmin } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Reseñas' };

export default function ReviewsPage({ searchParams }: PageProps<'/admin/resenas'>) {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-semibold">Reseñas</h1>
      <Suspense fallback={<p className="text-sm text-muted">Cargando reseñas…</p>}>
        <Reviews searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Reviews({ searchParams }: Pick<PageProps<'/admin/resenas'>, 'searchParams'>) {
  await requireAdmin();
  const { tab } = await searchParams;
  const approved = tab === 'publicadas';
  const { data } = await listReviews(approved);

  return (
    <>
      <nav aria-label="Tipo de reseña" className="mb-4">
        <ul className="flex gap-1 text-sm">
          {[
            { href: '/admin/resenas', label: 'Por aprobar', current: !approved },
            { href: '/admin/resenas?tab=publicadas', label: 'Publicadas', current: approved },
          ].map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={l.current ? 'page' : undefined} className={`block rounded-full px-3 py-1.5 ${l.current ? 'bg-ink text-paper' : 'bg-paper hover:bg-stone'}`}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {data.length === 0 ? (
        <p className="rounded-lg border border-line bg-paper p-8 text-center text-sm text-muted">
          {approved ? 'No hay reseñas publicadas.' : 'No hay reseñas pendientes.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r.documentId} className="rounded-lg border border-line bg-paper p-5">
              <article>
                <header className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <p>
                    <span className="font-semibold" aria-label={`${r.rating} de 5 estrellas`}>
                      {'★'.repeat(r.rating)}
                      <span className="text-stone-deep">{'★'.repeat(5 - r.rating)}</span>
                    </span>{' '}
                    {r.title && <strong>{r.title}</strong>}
                  </p>
                  <p className="text-xs text-muted">
                    {r.authorName} · {shortDate(r.createdAt)} · {r.product?.name ?? 'Producto eliminado'}
                  </p>
                </header>
                {/* React escapa el texto: aunque alguien escriba HTML o scripts, se muestra como texto plano. */}
                <p className="mt-2 text-sm whitespace-pre-line">{r.body}</p>
                <form action={moderateReview} className="mt-4 flex gap-2">
                  <input type="hidden" name="documentId" value={r.documentId} />
                  {approved ? (
                    <button name="intent" value="hide" className="btn btn-outline min-h-9 px-4">Ocultar</button>
                  ) : (
                    <button name="intent" value="approve" className="btn btn-primary min-h-9 px-4">Aprobar</button>
                  )}
                  <button name="intent" value="delete" className="btn min-h-9 px-4 text-signal hover:bg-[#fbe6e6]">Eliminar</button>
                </form>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
