import Image from 'next/image';
import { mediaUrl } from '@/lib/strapi/client';
import type { StrapiImage } from '@/lib/strapi/types';

type Props = {
  image: StrapiImage | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Texto del recuadro cuando la prenda aún no tiene foto. */
  placeholder?: string;
};

export function ProductImage({ image, alt, sizes, priority, className = '', placeholder }: Props) {
  const src = mediaUrl(image?.url);

  if (!src) {
    return (
      <div className={`@container absolute inset-0 grid place-items-center overflow-hidden bg-stone ${className}`} role="img" aria-label={alt}>
        <span className="wordmark px-3 text-[clamp(1rem,14cqw,2.4rem)] text-stone-deep select-none">{placeholder ?? 'SAULDT'}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={image?.alternativeText || alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
    />
  );
}
