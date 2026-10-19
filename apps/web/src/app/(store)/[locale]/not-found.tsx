import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';

// not-found no recibe params; se muestra en ambos idiomas para no depender de la URL.
export default function NotFound() {
  const es = getDictionary('es').notFound;
  const en = getDictionary('en').notFound;
  return (
    <section className="page-x mx-auto flex max-w-2xl flex-col items-start py-24">
      <p className="wordmark text-[clamp(5rem,18vw,12rem)] text-stone-deep" aria-hidden="true">
        404
      </p>
      <h1 className="display mt-4 text-3xl">{es.title}</h1>
      <p className="mt-3 text-muted">{es.body}</p>
      <p className="mt-1 text-sm text-muted" lang="en">
        {en.title}. {en.body}
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        {es.back}
      </Link>
    </section>
  );
}
