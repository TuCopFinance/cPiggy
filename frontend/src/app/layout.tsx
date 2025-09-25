import type { Metadata, Viewport } from "next";


import { headers } from 'next/headers' // added
import './globals.css';
import ContextProvider from '@/context'

export const metadata: Metadata = {
  title: "cPiggyFX",
  description: "Diversified FX Piggy Bank - Save in cCOP, grow in the world",
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      image: 'https://cpiggy-tests.up.railway.app/miniapp-image.png',
      button: {
        title: 'Open cPiggyFX',
        action: {
          type: 'launch',
          name: 'cPiggyFX',
          url: 'https://cpiggy.xyz'
        }
      }
    }),
    'fc:frame': JSON.stringify({
      version: 'next',
      image: 'https://cpiggy-tests.up.railway.app/frame-image.png',
      button: {
        title: 'Start Saving',
        action: {
          type: 'launch',
          name: 'cPiggyFX',
          url: 'https://cpiggy.xyz'
        }
      }
    })
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersData = await headers();
  const cookies = headersData.get('cookie');

  return (
    <html lang="en">
      <body>
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  );
}
