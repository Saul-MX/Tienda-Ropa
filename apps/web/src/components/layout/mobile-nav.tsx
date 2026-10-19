'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CloseIcon, MenuIcon } from '@/components/ui/icons';

type Item = { href: string; label: string };

export function MobileNav({ items, labels }: { items: Item[]; labels: { menu: string; close: string } }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center md:hidden"
        aria-label={labels.menu}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        className="m-0 h-dvh max-h-none w-full max-w-sm bg-paper p-0 backdrop:bg-ink/40"
        aria-label={labels.menu}
      >
        <div className="flex h-16 items-center justify-end px-4">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center"
            aria-label={labels.close}
            onClick={() => setOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="px-6">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="display block py-3 text-2xl" onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </dialog>
    </>
  );
}
