import Link from 'next/link';

export function SectionHeading({ id, title, href, linkLabel }: { id: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 id={id} className="display text-2xl md:text-3xl">
        {title}
      </h2>
      {href && linkLabel && (
        <Link href={href} className="link shrink-0 text-sm">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
