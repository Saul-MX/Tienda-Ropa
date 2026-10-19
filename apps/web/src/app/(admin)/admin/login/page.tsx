import type { Metadata } from 'next';
import { AdminLoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = { title: 'Entrar' };

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-stone px-4">
      <section className="w-full max-w-sm bg-paper p-8">
        <p className="wordmark text-3xl">SAULDT</p>
        <h1 className="mt-6 text-lg font-semibold">Panel de administración</h1>
        <p className="mt-1 text-sm text-muted">Usa tu cuenta con rol Store Admin.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
