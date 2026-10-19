import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { shortDate } from '@/components/admin/ui';
import { listSubscribers } from '@/lib/admin/data';
import { requireAdmin } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Newsletter' };

export default function SubscribersPage({ searchParams }: PageProps<'/admin/suscriptores'>) {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Newsletter</h1>
        <a href="/api/admin/subscribers" className="btn btn-outline min-h-10" download>
          Descargar CSV
        </a>
      </header>
      <Suspense fallback={<p className="text-sm text-muted">Cargando suscriptores…</p>}>
        <Subscribers searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Subscribers({ searchParams }: Pick<PageProps<'/admin/suscriptores'>, 'searchParams'>) {
  await requireAdmin();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { data, meta } = await listSubscribers(page);

  return (
    <>
      <p className="mb-3 text-sm text-muted">{meta.pagination.total} suscriptores</p>
      <div className="overflow-x-auto rounded-lg border border-line bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="px-4 py-3 font-medium">Correo</th>
              <th scope="col" className="px-4 py-3 font-medium">Idioma</th>
              <th scope="col" className="px-4 py-3 font-medium">Estado</th>
              <th scope="col" className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.documentId} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3 uppercase text-muted">{s.locale}</td>
                <td className="px-4 py-3">{s.active ? 'Activo' : 'Baja'}</td>
                <td className="px-4 py-3 text-muted">{shortDate(s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="p-8 text-center text-sm text-muted">Aún no hay suscriptores.</p>}
      </div>
      {meta.pagination.pageCount > 1 && (
        <nav aria-label="Paginación" className="mt-4 flex justify-between text-sm">
          {page > 1 ? <Link className="link" href={`?page=${page - 1}`}>Anterior</Link> : <span />}
          {page < meta.pagination.pageCount ? <Link className="link" href={`?page=${page + 1}`}>Siguiente</Link> : <span />}
        </nav>
      )}
    </>
  );
}
