import { getAdmin } from '@/lib/auth/session';
import { listSubscribers } from '@/lib/admin/data';

/** Exporta los suscriptores en CSV. Solo para administradores con sesión válida. */
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return new Response('Not found', { status: 404 });

  const rows: string[] = ['email,locale,active,created_at'];
  for (let page = 1; page <= 100; page++) {
    const { data, meta } = await listSubscribers(page, 100);
    // Evita inyección de fórmulas al abrir el CSV en Excel (=, +, -, @ al inicio).
    const cell = (v: string) => `"${v.replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;
    for (const s of data) rows.push([cell(s.email), s.locale, String(s.active), s.createdAt].join(','));
    if (page >= meta.pagination.pageCount) break;
  }

  return new Response(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="suscriptores.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
