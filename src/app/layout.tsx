import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Dardcor Media - Modern Chat & Communication',
  description: 'Platform obrolan dan komunikasi real-time modern dari Dardcor Media bernuansa ungu.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Dardcor Media',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`dark ${geistSans.variable} ${geistMono.variable} min-h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full w-full bg-[var(--wa-bg-app)] text-[var(--wa-text-primary)] relative">
        {children}
        <PWAInstallPrompt />

        {/* Register Service Worker for PWA (disabled on localhost to prevent stale chunk caching) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var r of registrations) {
                      r.unregister();
                    }
                  });
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      for (var name of names) {
                        caches.delete(name);
                      }
                    });
                  }
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(err) {
                      console.log('SW registration note:', err);
                    });
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
