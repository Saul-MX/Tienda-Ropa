'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { submitReview, type ReviewState } from '@/lib/actions/reviews';
import { getDictionary, type Locale } from '@/lib/i18n';

export function ReviewForm({ locale, productDocumentId, loginHref }: { locale: Locale; productDocumentId: string; loginHref: string }) {
  const t = getDictionary(locale).reviews;
  const errorsT = getDictionary(locale).account.errors;
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, { status: 'idle' });

  if (state.status === 'success') {
    return (
      <p role="status" className="border border-line p-6 text-sm">
        {t.pending}
      </p>
    );
  }

  return (
    <details className="group border border-line" open={state.status !== 'idle'}>
      <summary className="cursor-pointer list-none px-6 py-4 text-sm font-semibold">{t.write}</summary>
      <form action={action} className="space-y-4 px-6 pb-6">
        <input type="hidden" name="productDocumentId" value={productDocumentId} />

        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t.rating}</legend>
          <div className="flex flex-row-reverse justify-end gap-1 [&_label:has(:checked)~label]:text-ink">
            {[5, 4, 3, 2, 1].map((n) => (
              <label key={n} className="cursor-pointer text-2xl text-stone-deep has-[:checked]:text-ink">
                <input type="radio" name="rating" value={n} required className="sr-only" defaultChecked={n === 5} />
                <span aria-hidden="true">★</span>
                <span className="sr-only">{t.stars(n)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm">
          {t.name}
          <input name="authorName" required minLength={2} maxLength={60} className="field mt-1" autoComplete="given-name" />
        </label>
        <label className="block text-sm">
          {t.reviewTitle}
          <input name="title" maxLength={100} className="field mt-1" />
        </label>
        <label className="block text-sm">
          {t.body}
          <textarea name="body" required minLength={10} maxLength={2000} rows={4} className="field mt-1" />
        </label>

        {state.status === 'login' && (
          <p className="text-sm text-signal" role="alert">
            <Link href={loginHref} className="link">
              {t.loginToReview}
            </Link>
          </p>
        )}
        {(state.status === 'error' || state.status === 'invalid') && (
          <p className="text-sm text-signal" role="alert">
            {errorsT.generic}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={pending}>
          {t.submit}
        </button>
      </form>
    </details>
  );
}
