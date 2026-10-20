import type { NextConfig } from 'next';
import { englishRewrites } from './src/lib/i18n/routes';

const isDev = process.env.NODE_ENV !== 'production';
const strapiUrl = new URL(process.env.STRAPI_URL ?? 'http://localhost:1337');

/**
 * CSP estricta para todo lo que no sea script inline: Next.js necesita 'unsafe-inline' en
 * scripts mientras las páginas sean estáticas (los nonces obligan a renderizar todo en cada
 * request). Stripe Checkout es una redirección, así que no se carga JS de terceros.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://res.cloudinary.com ${strapiUrl.origin}`,
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "manifest-src 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Solo afecta a `next dev`: además de localhost, permite abrir la tienda como 127.0.0.1
  // o desde la IP de tu red (p. ej. para probar en el celular). Sin esto los botones no responden.
  allowedDevOrigins: ['127.0.0.1', '192.168.*.*'],
  reactStrictMode: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      {
        protocol: strapiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: strapiUrl.hostname,
        port: strapiUrl.port,
        pathname: '/uploads/**',
      },
    ],
    // Solo en local: permite optimizar imágenes subidas a Strapi en localhost.
    dangerouslyAllowLocalIP: isDev,
  },
  async headers() {
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    return [
      { source: '/:path*', headers: securityHeaders },
      ...['/admin/:path*', '/api/:path*', '/:locale/cuenta/:path*', '/:locale/account/:path*', '/:locale/checkout/:path*'].map(
        (source) => ({ source, headers: noindex }),
      ),
    ];
  },
  async redirects() {
    return [{ source: '/favicon.ico', destination: '/icon.svg', permanent: true }];
  },
  async rewrites() {
    return { beforeFiles: englishRewrites(), afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
