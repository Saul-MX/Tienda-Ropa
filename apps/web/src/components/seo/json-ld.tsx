/**
 * Inserta datos estructurados para Google. Se escapa "<" para que ningún texto capturado
 * en Strapi pueda cerrar la etiqueta <script> e inyectar HTML (XSS).
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
