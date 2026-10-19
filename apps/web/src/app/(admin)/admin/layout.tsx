import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import '../../globals.css';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s · SauldT Admin' },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <html lang="es-MX" className={archivo.variable}>
      <body className="min-h-dvh bg-paper">{children}</body>
    </html>
  );
}
