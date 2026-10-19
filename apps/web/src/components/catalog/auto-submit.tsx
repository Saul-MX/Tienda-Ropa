'use client';

import { useEffect, useRef } from 'react';

/**
 * Mejora progresiva: sin JavaScript el formulario de filtros funciona con su botón;
 * con JavaScript, cada cambio en un checkbox o el orden aplica los filtros al instante.
 */
export function AutoSubmit() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = ref.current?.closest('form');
    if (!form) return;
    const onChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'checkbox' || target.tagName === 'SELECT') form.requestSubmit();
    };
    form.addEventListener('change', onChange);
    return () => form.removeEventListener('change', onChange);
  }, []);

  return <span ref={ref} hidden />;
}
