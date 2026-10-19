'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { login, register, type AuthState } from '@/lib/actions/auth';
import { getDictionary, type Locale } from '@/lib/i18n';

type Props = { mode: 'login' | 'register'; locale: Locale; switchHref: string };

export function AuthForm({ mode, locale, switchHref }: Props) {
  const t = getDictionary(locale).account;
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === 'login' ? login : register, {});

  const errorText = state.error
    ? state.error === 'weak'
      ? t.passwordHint
      : t.errors[state.error === 'taken' ? 'taken' : state.error === 'rateLimited' ? 'rateLimited' : state.error === 'invalid' ? 'invalid' : 'generic']
    : null;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      {mode === 'register' && (
        <label className="block text-sm">
          {t.username}
          <input name="username" required minLength={2} maxLength={60} autoComplete="name" className="field mt-1" />
        </label>
      )}
      <label className="block text-sm">
        {t.email}
        <input name="email" type="email" required maxLength={254} autoComplete="email" defaultValue={state.email} className="field mt-1" />
      </label>
      <label className="block text-sm">
        {t.password}
        <input
          name="password"
          type="password"
          required
          minLength={mode === 'register' ? 8 : 1}
          maxLength={200}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="field mt-1"
          aria-describedby={mode === 'register' ? 'password-hint' : undefined}
        />
        {mode === 'register' && (
          <span id="password-hint" className="mt-1 block text-xs text-muted">
            {t.passwordHint}
          </span>
        )}
      </label>

      {errorText && (
        <p className="text-sm text-signal" role="alert">
          {errorText}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {mode === 'login' ? t.login : t.register}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === 'login' ? t.noAccount : t.haveAccount}{' '}
        <Link href={switchHref} className="link text-ink">
          {mode === 'login' ? t.register : t.login}
        </Link>
      </p>
      <p className="text-center text-xs text-muted">{t.guestNote}</p>
    </form>
  );
}
