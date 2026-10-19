import { getDictionary, type Locale } from '@/lib/i18n';
import { localized } from '@/lib/product';
import type { SizeGuide as Guide } from '@/lib/strapi/types';

export function SizeGuide({ guide, locale }: { guide: Guide; locale: Locale }) {
  const t = getDictionary(locale).product;
  const table = guide.measurements;
  const notes = localized(guide, 'notes', locale);
  if (!table?.headers?.length) return null;

  return (
    <details className="group border-b border-line py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        {t.sizeGuide}
        <span className="text-muted transition-transform group-open:rotate-45" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="overflow-x-auto pt-4">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{guide.name}</caption>
          <thead>
            <tr className="border-b border-line">
              {table.headers.map((h) => (
                <th key={h} scope="col" className="py-2 pr-4 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.join('-')} className="border-b border-line/60">
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="py-2 pr-4 font-medium">
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="py-2 pr-4 text-muted">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {notes && <p className="mt-3 text-sm text-muted">{notes}</p>}
      </div>
    </details>
  );
}
