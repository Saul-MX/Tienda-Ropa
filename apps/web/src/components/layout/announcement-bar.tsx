import type { Locale } from '@/lib/i18n';
import { getSettings } from '@/lib/strapi/catalog';
import { localized } from '@/lib/product';

export async function AnnouncementBar({ locale }: { locale: Locale }) {
  const settings = await getSettings().catch(() => null);
  const text = settings ? localized(settings, 'announcement', locale) : '';
  if (!text) return null;

  return (
    <aside className="bg-ink px-4 py-2 text-center text-xs font-medium text-paper" aria-label="Aviso">
      {text}
    </aside>
  );
}
