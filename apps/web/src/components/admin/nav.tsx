'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/inventario', label: 'Inventario' },
  { href: '/admin/resenas', label: 'Reseñas' },
  { href: '/admin/suscriptores', label: 'Newsletter' },
];

export function AdminNav() {
  const pathname = usePathname();
  const strapiPanel = process.env.NEXT_PUBLIC_STRAPI_PANEL_URL;

  return (
    <nav aria-label="Panel" className="overflow-x-auto px-3 pb-3 lg:pb-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map((item) => {
          const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`block rounded-md px-3 py-2 text-sm whitespace-nowrap ${active ? 'bg-ink text-paper' : 'hover:bg-stone'}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
        {strapiPanel && (
          <li>
            <a href={strapiPanel} target="_blank" rel="noopener noreferrer" className="block rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted hover:bg-stone">
              Productos (Strapi) ↗
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
