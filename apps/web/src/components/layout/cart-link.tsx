'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { BagIcon } from '@/components/ui/icons';
import { cartCount, useCart } from '@/lib/cart/store';

const subscribe = () => () => {};

export function CartLink({ href, label }: { href: string; label: string }) {
  const lines = useCart((s) => s.lines);
  // El conteo vive en localStorage: se muestra solo después de hidratar para evitar desajustes.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const count = hydrated ? cartCount(lines) : 0;

  return (
    <Link href={href} className="relative inline-flex size-11 items-center justify-center" aria-label={`${label} (${count})`}>
      <BagIcon />
      {count > 0 && (
        <span className="absolute top-1.5 right-1 grid min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] leading-4 font-semibold text-paper">
          {count}
        </span>
      )}
    </Link>
  );
}
