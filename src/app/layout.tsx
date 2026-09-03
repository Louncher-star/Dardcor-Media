import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Dardcor Media - Modern Chat & Communication',
  description: 'Platform obrolan dan komunikasi real-time modern dari Dardcor Media.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`dark ${geistSans.variable} ${geistMono.variable} min-h-full antialiased`}>
      <body className="min-h-full w-full bg-[var(--wa-bg-app)] text-[var(--wa-text-primary)]">
        {children}
      </body>
    </html>
  );
}
