import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VEDH Business Studio | Artisanal Handicrafts & Operations Hub',
  description: 'Operations, inventory, orders, and branded invoicing for VEDH luxury handicrafts and bespoke return gifts.',
  icons: {
    icon: '/vedh-logo.jpg',
  },
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
