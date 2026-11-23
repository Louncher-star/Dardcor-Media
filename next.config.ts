import type { NextConfig } from 'next';
import { securityHeadersForEnvironment } from './src/lib/security/headers';

const securityHeaders = Object.entries(securityHeadersForEnvironment()).map(([key, value]) => ({
  key,
  value,
}));

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Rute feed media lama sudah dihapus; arahkan ke pusat obrolan.
      { source: '/media', destination: '/chat', permanent: false },
    ];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Content-Type', value: 'application/manifest+json' }],
      },
    ];
  },
};

export default nextConfig;
