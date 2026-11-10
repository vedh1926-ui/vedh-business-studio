import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VEDH Business Studio | Artisanal Handicrafts & Operations Hub',
  description: 'Operations, inventory, orders, and branded invoicing for VEDH luxury handicrafts and bespoke return gifts.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VEDH Studio',
  },
};

export const viewport = {
  themeColor: '#541523',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF6F0] text-[#241A1B] antialiased">
        {children}
      </body>
    </html>
  );
}
