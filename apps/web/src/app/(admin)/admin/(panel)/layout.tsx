import { Suspense } from 'react';
import { AdminNav } from '@/components/admin/nav';
import { requireAdmin } from '@/lib/auth/session';
import { adminLogout } from '@/lib/actions/auth';

/** Verifica el rol en el servidor antes de renderizar cualquier página del panel. */
async function Guard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

async function CurrentAdmin() {
  const admin = await requireAdmin();
  return (
    <div className="border-t border-line pt-4 text-xs">
      <p className="truncate text-muted">{admin.email}</p>
      <form action={adminLogout} className="mt-2">
        <button type="submit" className="link">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}

export default function PanelLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-line bg-paper lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center px-6">
          <span className="wordmark text-xl">SAULDT</span>
          <span className="ml-2 text-xs text-muted">Admin</span>
        </div>
        <Suspense fallback={<div className="h-10" />}>
          <AdminNav />
        </Suspense>
        <div className="mt-auto hidden px-6 pb-6 lg:block">
          <Suspense>
            <CurrentAdmin />
          </Suspense>
        </div>
      </aside>
      <main className="min-w-0 bg-[#f6f6f4] px-4 py-8 md:px-8">
        <Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
          <Guard>{children}</Guard>
        </Suspense>
      </main>
    </div>
  );
}
