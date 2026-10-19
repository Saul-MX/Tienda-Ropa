export type Gender = 'hombre' | 'mujer' | 'unisex';
export type SizeSystem = 'letras' | 'numerico' | 'calzado' | 'unica';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type Season = 'primavera-verano' | 'otono-invierno' | 'capsula' | 'permanente';

export type StrapiImage = {
  url: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
};

export type Seo = {
  metaTitle: string | null;
  metaDescription: string | null;
  shareImage: StrapiImage | null;
} | null;

export type Color = {
  documentId: string;
  name: string;
  nameEn: string | null;
  slug: string;
  hex: string;
};

export type Variant = {
  id: number;
  sku: string;
  size: string;
  stock: number;
  color: Color | null;
};

export type Brand = {
  documentId: string;
  name: string;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  logo: StrapiImage | null;
  seo?: Seo;
};

export type Category = {
  documentId: string;
  name: string;
  nameEn: string | null;
  slug: string;
  order: number | null;
  image: StrapiImage | null;
  seo?: Seo;
};

export type SizeGuide = {
  name: string;
  sizeSystem: SizeSystem;
  measurements: { headers: string[]; rows: string[][] } | null;
  notes: string | null;
  notesEn: string | null;
};

export type Collection = {
  documentId: string;
  name: string;
  nameEn: string | null;
  slug: string;
  season: Season;
  year: number | null;
  description: string | null;
  descriptionEn: string | null;
  cover: StrapiImage | null;
  featured: boolean;
  products?: Product[];
  seo?: Seo;
  updatedAt: string;
};

export type Product = {
  documentId: string;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string;
  descriptionEn: string | null;
  material: string | null;
  materialEn: string | null;
  gender: Gender;
  priceMxn: number;
  priceUsd: number;
  salePriceMxn: number | null;
  salePriceUsd: number | null;
  images: StrapiImage[] | null;
  brand: Pick<Brand, 'documentId' | 'name' | 'slug'> | null;
  category: Pick<Category, 'documentId' | 'name' | 'nameEn' | 'slug'> | null;
  collections?: Pick<Collection, 'name' | 'nameEn' | 'slug'>[];
  sizeSystem: SizeSystem;
  sizeGuide?: SizeGuide | null;
  variants: Variant[];
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  seo?: Seo;
  createdAt: string;
  updatedAt: string;
};

export type Review = {
  documentId: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  createdAt: string;
};

export type StoreSettings = {
  announcement: string | null;
  announcementEn: string | null;
  heroTitle: string | null;
  heroTitleEn: string | null;
  heroSubtitle: string | null;
  heroSubtitleEn: string | null;
  heroImage: StrapiImage | null;
  freeShippingMinMxn: number;
  freeShippingMinUsd: number;
  shippingCostMxn: number;
  shippingCostUsd: number;
  lowStockThreshold: number;
  instagramUrl: string | null;
  tiktokUrl: string | null;
};

export type OrderItem = {
  sku: string;
  productDocumentId: string | null;
  productName: string;
  productSlug: string | null;
  brandName: string | null;
  categoryName: string | null;
  gender: string | null;
  size: string | null;
  colorName: string | null;
  image: string | null;
  quantity: number;
  unitPrice: number;
};

export type Address = {
  name: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
} | null;

export type Order = {
  id: number;
  documentId: string;
  orderNumber: string;
  email: string | null;
  status: OrderStatus;
  currency: 'mxn' | 'usd';
  locale: 'es' | 'en' | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  items: OrderItem[];
  shippingAddress: Address;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
};

export type Pagination = { page: number; pageSize: number; pageCount: number; total: number };

export type ListResponse<T> = { data: T[]; meta: { pagination: Pagination } };
export type SingleResponse<T> = { data: T };
