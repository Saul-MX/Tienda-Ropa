import type { Core } from '@strapi/strapi';

/**
 * Datos de demostración para ver la tienda funcionando sin capturar nada.
 * Solo corre con SEED_DEMO_DATA=true y si todavía no hay productos.
 * Las imágenes se suben después desde el panel de Strapi.
 */
export async function seedDemoData(strapi: Core.Strapi) {
  const existing = await strapi.documents('api::product.product').count({});
  if (existing > 0) return;

  strapi.log.info('Cargando datos demo…');

  const create = <T extends Record<string, unknown>>(uid: any, data: T) =>
    strapi.documents(uid).create({ data } as any) as Promise<{ documentId: string }>;

  const brands = {
    studio: await create('api::brand.brand', {
      name: 'SauldT Studio',
      slug: 'sauldt-studio',
      description: 'La línea propia de la casa: básicos premium hechos en México.',
      descriptionEn: 'Our in-house line: premium essentials made in Mexico.',
    }),
    nordico: await create('api::brand.brand', {
      name: 'Nórdico',
      slug: 'nordico',
      description: 'Sastrería escandinava de líneas limpias.',
      descriptionEn: 'Scandinavian tailoring with clean lines.',
    }),
    atelier: await create('api::brand.brand', {
      name: 'Atelier Nueve',
      slug: 'atelier-nueve',
      description: 'Streetwear de edición limitada.',
      descriptionEn: 'Limited-edition streetwear.',
    }),
  };

  const categories: Record<string, { documentId: string }> = {};
  for (const [i, [name, nameEn, slug]] of [
    ['Playeras', 'T-shirts', 'playeras'],
    ['Camisas', 'Shirts', 'camisas'],
    ['Sudaderas', 'Hoodies', 'sudaderas'],
    ['Pantalones', 'Pants', 'pantalones'],
    ['Chamarras', 'Jackets', 'chamarras'],
    ['Tenis', 'Sneakers', 'tenis'],
  ].entries()) {
    categories[slug] = await create('api::category.category', { name, nameEn, slug, order: i });
  }

  const colors: Record<string, { documentId: string }> = {};
  for (const [name, nameEn, slug, hex] of [
    ['Negro', 'Black', 'negro', '#111111'],
    ['Blanco', 'White', 'blanco', '#F5F5F2'],
    ['Arena', 'Sand', 'arena', '#D8CBB3'],
    ['Oliva', 'Olive', 'oliva', '#5B5E3E'],
    ['Azul marino', 'Navy', 'azul-marino', '#1E2A44'],
    ['Gris', 'Grey', 'gris', '#9A9A97'],
  ]) {
    colors[slug] = await create('api::color.color', { name, nameEn, slug, hex });
  }

  const guides = {
    letras: await create('api::size-guide.size-guide', {
      name: 'Prendas superiores',
      sizeSystem: 'letras',
      measurements: {
        headers: ['Talla', 'Pecho (cm)', 'Largo (cm)'],
        rows: [['XS', '84-88', '66'], ['S', '89-94', '68'], ['M', '95-100', '71'], ['L', '101-106', '74'], ['XL', '107-112', '76']],
      },
      notes: 'Corte regular. Si estás entre dos tallas, elige la mayor.',
      notesEn: 'Regular fit. If you are between sizes, size up.',
    }),
    numerico: await create('api::size-guide.size-guide', {
      name: 'Pantalones',
      sizeSystem: 'numerico',
      measurements: {
        headers: ['Talla', 'Cintura (cm)', 'Cadera (cm)'],
        rows: [['28', '71', '90'], ['30', '76', '95'], ['32', '81', '100'], ['34', '86', '105'], ['36', '91', '110']],
      },
    }),
    calzado: await create('api::size-guide.size-guide', {
      name: 'Calzado',
      sizeSystem: 'calzado',
      measurements: {
        headers: ['MX', 'US', 'Largo de pie (cm)'],
        rows: [['24', '6', '24'], ['25', '7', '25'], ['26', '8', '26'], ['27', '9', '27'], ['28', '10', '28']],
      },
    }),
  };

  const sizesFor = { letras: ['S', 'M', 'L', 'XL'], numerico: ['28', '30', '32', '34'], calzado: ['25', '26', '27', '28'] };

  const products: {
    name: string; nameEn: string; slug: string; brand: keyof typeof brands; category: string;
    gender: 'hombre' | 'mujer' | 'unisex'; sizeSystem: keyof typeof sizesFor; colors: string[];
    priceMxn: number; priceUsd: number; salePriceMxn?: number; salePriceUsd?: number;
    material: string; materialEn: string; isNew?: boolean; isBestseller?: boolean; isFeatured?: boolean;
  }[] = [
    { name: 'Playera Esencial Heavyweight', nameEn: 'Essential Heavyweight Tee', slug: 'playera-esencial-heavyweight', brand: 'studio', category: 'playeras', gender: 'unisex', sizeSystem: 'letras', colors: ['negro', 'blanco', 'arena'], priceMxn: 690, priceUsd: 39, material: '100% algodón peinado, 240 g/m²', materialEn: '100% combed cotton, 240 gsm', isBestseller: true, isFeatured: true },
    { name: 'Camisa Oxford Relaxed', nameEn: 'Relaxed Oxford Shirt', slug: 'camisa-oxford-relaxed', brand: 'nordico', category: 'camisas', gender: 'hombre', sizeSystem: 'letras', colors: ['blanco', 'azul-marino'], priceMxn: 1490, priceUsd: 85, material: '100% algodón Oxford', materialEn: '100% Oxford cotton', isNew: true, isFeatured: true },
    { name: 'Sudadera Boxy Logo', nameEn: 'Boxy Logo Hoodie', slug: 'sudadera-boxy-logo', brand: 'atelier', category: 'sudaderas', gender: 'unisex', sizeSystem: 'letras', colors: ['negro', 'gris', 'oliva'], priceMxn: 1890, priceUsd: 109, salePriceMxn: 1490, salePriceUsd: 85, material: '80% algodón, 20% poliéster, felpa francesa', materialEn: '80% cotton, 20% polyester, French terry', isBestseller: true },
    { name: 'Pantalón Plisado Wide Leg', nameEn: 'Pleated Wide-Leg Trousers', slug: 'pantalon-plisado-wide-leg', brand: 'nordico', category: 'pantalones', gender: 'mujer', sizeSystem: 'numerico', colors: ['arena', 'negro'], priceMxn: 1690, priceUsd: 95, material: '64% poliéster, 34% viscosa, 2% elastano', materialEn: '64% polyester, 34% viscose, 2% elastane', isNew: true, isFeatured: true },
    { name: 'Chamarra Utility Oliva', nameEn: 'Olive Utility Jacket', slug: 'chamarra-utility-oliva', brand: 'atelier', category: 'chamarras', gender: 'hombre', sizeSystem: 'letras', colors: ['oliva', 'negro'], priceMxn: 2890, priceUsd: 165, material: 'Ripstop de algodón', materialEn: 'Cotton ripstop', isFeatured: true },
    { name: 'Blusa Popelina Oversize', nameEn: 'Oversized Poplin Blouse', slug: 'blusa-popelina-oversize', brand: 'studio', category: 'camisas', gender: 'mujer', sizeSystem: 'letras', colors: ['blanco', 'arena'], priceMxn: 1290, priceUsd: 75, material: '100% algodón popelina', materialEn: '100% cotton poplin', isNew: true },
    { name: 'Tenis Court Minimal', nameEn: 'Minimal Court Sneakers', slug: 'tenis-court-minimal', brand: 'studio', category: 'tenis', gender: 'unisex', sizeSystem: 'calzado', colors: ['blanco', 'negro'], priceMxn: 2490, priceUsd: 139, salePriceMxn: 1990, salePriceUsd: 115, material: 'Piel de becerro, suela de goma', materialEn: 'Calf leather, rubber sole', isBestseller: true },
    { name: 'Jogger Técnico', nameEn: 'Tech Jogger', slug: 'jogger-tecnico', brand: 'atelier', category: 'pantalones', gender: 'hombre', sizeSystem: 'numerico', colors: ['negro', 'gris'], priceMxn: 1390, priceUsd: 79, material: 'Nylon elástico repelente al agua', materialEn: 'Water-repellent stretch nylon' },
  ];

  for (const p of products) {
    const variants = p.colors.flatMap((color, ci) =>
      sizesFor[p.sizeSystem].map((size, si) => ({
        sku: `${p.slug.split('-').map((w) => w[0]).join('').toUpperCase()}-${color.slice(0, 3).toUpperCase()}-${size}`,
        size,
        color: colors[color].documentId,
        stock: (ci + si) % 5 === 0 ? 2 : 6 + ((ci * 3 + si * 7) % 14),
      })),
    );

    await create('api::product.product', {
      name: p.name,
      nameEn: p.nameEn,
      slug: p.slug,
      description: `${p.name}: una prenda pensada para durar, con caída impecable y acabados cuidados.`,
      descriptionEn: `${p.nameEn}: built to last, with a clean drape and careful finishing.`,
      material: p.material,
      materialEn: p.materialEn,
      gender: p.gender,
      priceMxn: p.priceMxn,
      priceUsd: p.priceUsd,
      salePriceMxn: p.salePriceMxn ?? null,
      salePriceUsd: p.salePriceUsd ?? null,
      brand: brands[p.brand].documentId,
      category: categories[p.category].documentId,
      sizeSystem: p.sizeSystem,
      sizeGuide: guides[p.sizeSystem].documentId,
      variants,
      isNew: p.isNew ?? false,
      isBestseller: p.isBestseller ?? false,
      isFeatured: p.isFeatured ?? false,
      active: true,
    });
  }

  const all = await strapi.documents('api::product.product').findMany({ fields: ['slug'] });
  const bySlug = Object.fromEntries(all.map((p) => [p.slug, p.documentId]));

  await create('api::collection.collection', {
    name: 'Otoño–Invierno 2026',
    nameEn: 'Fall–Winter 2026',
    slug: 'otono-invierno-2026',
    season: 'otono-invierno',
    year: 2026,
    description: 'Capas, texturas y una paleta de tierra para la temporada fría.',
    descriptionEn: 'Layers, texture and an earthy palette for the cold season.',
    featured: true,
    active: true,
    products: ['chamarra-utility-oliva', 'sudadera-boxy-logo', 'pantalon-plisado-wide-leg', 'jogger-tecnico'].map((s) => bySlug[s]),
  });

  await create('api::collection.collection', {
    name: 'Esenciales',
    nameEn: 'Essentials',
    slug: 'esenciales',
    season: 'permanente',
    description: 'Los básicos que nunca salen de temporada.',
    descriptionEn: 'The basics that never go out of season.',
    featured: true,
    active: true,
    products: ['playera-esencial-heavyweight', 'camisa-oxford-relaxed', 'blusa-popelina-oversize', 'tenis-court-minimal'].map((s) => bySlug[s]),
  });

  strapi.log.info(`Datos demo listos: ${products.length} productos.`);
}
