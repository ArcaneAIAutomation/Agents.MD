/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'api.coindesk.com'],
  },
  // Fix WebSocket HMR issues
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  // Experimental features for better HMR
  experimental: {
    esmExternals: false,
  },
}

module.exports = nextConfig
