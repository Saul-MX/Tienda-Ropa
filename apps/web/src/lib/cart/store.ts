'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * El carrito solo guarda SKU y cantidad. Precios, nombres y stock se consultan siempre
 * en el servidor, así que modificar localStorage no cambia lo que se cobra.
 */
export type CartLine = { sku: string; quantity: number };

export const MAX_QTY_PER_LINE = 10;
export const MAX_LINES = 30;

type CartState = {
  lines: CartLine[];
  add: (sku: string, quantity?: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
};

const clamp = (n: number) => Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.floor(n)));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (sku, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.sku === sku);
          if (existing) {
            return { lines: state.lines.map((l) => (l.sku === sku ? { ...l, quantity: clamp(l.quantity + quantity) } : l)) };
          }
          if (state.lines.length >= MAX_LINES) return state;
          return { lines: [...state.lines, { sku, quantity: clamp(quantity) }] };
        }),
      setQuantity: (sku, quantity) =>
        set((state) => ({ lines: state.lines.map((l) => (l.sku === sku ? { ...l, quantity: clamp(quantity) } : l)) })),
      remove: (sku) => set((state) => ({ lines: state.lines.filter((l) => l.sku !== sku) })),
      clear: () => set({ lines: [] }),
      replace: (lines) => set({ lines }),
    }),
    {
      name: 'sdt-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Si alguien edita el valor guardado a mano, se descarta lo que no tenga la forma esperada.
      merge: (persisted, current) => {
        const lines = (persisted as { lines?: unknown })?.lines;
        const valid = Array.isArray(lines)
          ? lines
              .filter(
                (l): l is CartLine =>
                  typeof l?.sku === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(l.sku) && Number.isFinite(l?.quantity),
              )
              .slice(0, MAX_LINES)
              .map((l) => ({ sku: l.sku, quantity: clamp(l.quantity) }))
          : [];
        return { ...current, lines: valid };
      },
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.quantity, 0);
