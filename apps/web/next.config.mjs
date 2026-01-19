/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@sola/database',
    '@sola/auth',
    '@sola/payments',
    '@sola/video',
    '@sola/email',
    '@sola/ui',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.mux.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
    ],
  },
}

export default nextConfig
