import { StarIcon } from '@/components/ui/icons';
import { formatDate } from '@/lib/format';
import { getDictionary, localizePath, type Locale } from '@/lib/i18n';
import type { Review } from '@/lib/strapi/types';
import { ReviewForm } from './review-form';

export function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} size={14} filled={n <= Math.round(value)} />
      ))}
    </span>
  );
}

export function averageRating(reviews: Review[]) {
  return reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
}

export function Reviews({ reviews, locale, productDocumentId }: { reviews: Review[]; locale: Locale; productDocumentId: string }) {
  const t = getDictionary(locale).reviews;
  const avg = averageRating(reviews);

  return (
    <section aria-labelledby="reviews-title" className="mt-24 grid gap-10 border-t border-line pt-12 lg:grid-cols-[20rem_1fr]">
      <div>
        <h2 id="reviews-title" className="display text-2xl">
          {t.title}
        </h2>
        {reviews.length > 0 && (
          <p className="mt-3 flex items-center gap-2 text-sm">
            <Stars value={avg} label={t.stars(Math.round(avg))} />
            {t.average(avg.toFixed(1), reviews.length)}
          </p>
        )}
        <div className="mt-6">
          <ReviewForm locale={locale} productDocumentId={productDocumentId} loginHref={localizePath(locale, '/cuenta/entrar')} />
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-muted">{t.none}</p>
      ) : (
        <ul className="divide-y divide-line">
          {reviews.map((r) => (
            <li key={r.documentId} className="py-6 first:pt-0">
              <article>
                <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={r.rating} label={t.stars(r.rating)} />
                  {r.title && <h3 className="font-semibold">{r.title}</h3>}
                </header>
                <p className="mt-2 max-w-prose text-sm leading-relaxed">{r.body}</p>
                <footer className="mt-2 text-xs text-muted">
                  {r.authorName} · <time dateTime={r.createdAt}>{formatDate(r.createdAt, locale)}</time>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
