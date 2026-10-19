import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

type Props = {
  title: string;
  description?: string | null;
  breadcrumbs: { name: string; href: string }[];
  breadcrumbLabel: string;
  links?: { href: string; label: string; current?: boolean }[];
};

export function CatalogHeader({ title, description, breadcrumbs, breadcrumbLabel, links }: Props) {
  return (
    <header className="mb-10 pt-8">
      <Breadcrumbs items={breadcrumbs} label={breadcrumbLabel} />
      <h1 className="wordmark mt-6 text-[clamp(2.5rem,7vw,5.5rem)]">{title}</h1>
      {description && <p className="mt-4 max-w-2xl text-muted">{description}</p>}
      {links && links.length > 0 && (
        <nav aria-label={title} className="mt-8 -mx-4 overflow-x-auto px-4">
          <ul className="flex gap-2 whitespace-nowrap">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={l.current ? 'page' : undefined}
                  className={`inline-flex h-9 items-center rounded-full border px-4 text-sm ${
                    l.current ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
