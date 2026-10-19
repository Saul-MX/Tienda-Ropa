'use client';

import { useActionState } from 'react';
import { subscribeToNewsletter, type NewsletterState } from '@/lib/actions/newsletter';
import { getDictionary, type Locale } from '@/lib/i18n';

export function NewsletterForm({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).newsletter;
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeToNewsletter, { status: 'idle' });

  const message = {
    idle: null,
    success: t.success,
    invalid: t.invalid,
    error: t.error,
  }[state.status];

  return (
    <form action={action} className="w-full max-w-md" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <div className="hidden" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder={t.placeholder}
          className="field flex-1 rounded-full"
          aria-describedby="newsletter-status"
        />
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {t.submit}
        </button>
      </div>
      <p
        id="newsletter-status"
        role="status"
        className={`mt-3 min-h-5 text-sm ${state.status === 'success' ? 'text-ok' : 'text-signal'}`}
      >
        {message}
      </p>
    </form>
  );
}
