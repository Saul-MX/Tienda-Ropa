'use client';

import { useActionState } from 'react';
import { adminLogin, type AuthState } from '@/lib/actions/auth';

const messages: Record<NonNullable<AuthState['error']>, string> = {
  invalid: 'Correo o contraseña incorrectos, o la cuenta no tiene acceso al panel.',
  rateLimited: 'Demasiados intentos. Espera 15 minutos.',
  taken: 'Error inesperado.',
  weak: 'Error inesperado.',
  generic: 'No se pudo iniciar sesión. Revisa que Strapi esté encendido.',
};

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(adminLogin, {});
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block text-sm">
        Correo
        <input name="email" type="email" required autoComplete="username" className="field mt-1" />
      </label>
      <label className="block text-sm">
        Contraseña
        <input name="password" type="password" required autoComplete="current-password" className="field mt-1" />
      </label>
      {state.error && (
        <p className="text-sm text-signal" role="alert">
          {messages[state.error]}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        Entrar
      </button>
    </form>
  );
}
