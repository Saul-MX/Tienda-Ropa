import { ProductImage } from './product-image';
import type { StrapiImage } from '@/lib/strapi/types';

/**
 * Móvil: carrusel con scroll-snap (deslizable, sin JavaScript).
 * Escritorio: rejilla editorial de dos columnas con la primera foto a todo el ancho.
 */
export function Gallery({ images, alt, placeholder }: { images: StrapiImage[]; alt: string; placeholder?: string }) {
  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/5] bg-stone">
        <ProductImage image={null} alt={alt} sizes="50vw" placeholder={placeholder} />
      </div>
    );
  }

  return (
    <div>
      <ul className="-mx-4 flex snap-x snap-mandatory overflow-x-auto md:hidden" aria-label={alt}>
        {images.map((img, i) => (
          <li key={img.url} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-stone">
            <ProductImage image={img} alt={`${alt} — ${i + 1}/${images.length}`} sizes="100vw" priority={i === 0} />
          </li>
        ))}
      </ul>
      <ul className="hidden grid-cols-2 gap-2 md:grid">
        {images.map((img, i) => (
          <li key={img.url} className={`relative bg-stone ${i === 0 ? 'col-span-2 aspect-[4/5]' : 'aspect-[4/5]'}`}>
            <ProductImage
              image={img}
              alt={`${alt} — ${i + 1}/${images.length}`}
              sizes={i === 0 ? '60vw' : '30vw'}
              priority={i === 0}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
