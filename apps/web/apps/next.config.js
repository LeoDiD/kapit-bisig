/** @type {import('next').NextConfig} */
const LOCAL_API_PROXY_TARGET = 'http://127.0.0.1:3001/api'
const PRIVATE_DEV_TARGET_REGEX =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?(\/|$)/i

function isPrivateDevTarget(target) {
  return PRIVATE_DEV_TARGET_REGEX.test(target)
}

function resolveApiProxyTarget() {
  const configured = (process.env.API_PROXY_TARGET || '').trim()
  if (!configured) return LOCAL_API_PROXY_TARGET

  const isRemoteTarget =
    /^https?:\/\//i.test(configured) && !isPrivateDevTarget(configured)
  const allowRemoteInDev = process.env.API_PROXY_ALLOW_REMOTE === 'true'

  if (process.env.NODE_ENV === 'development' && isRemoteTarget && !allowRemoteInDev) {
    return LOCAL_API_PROXY_TARGET
  }

  return configured
}

const nextConfig = {
  reactStrictMode: true,
  // Use a dedicated build directory to avoid Windows file-lock issues on `.next/trace`.
  distDir: '.next-app',
  webpack(config, { dev }) {
    if (dev) {
      // Avoid flaky Windows filesystem cache pack-file races in Next dev mode.
      config.cache = {
        type: 'memory',
      }
    }

    return config
  },
  async rewrites() {
    const target = resolveApiProxyTarget()
    return [
      {
        source: '/api/:path*',
        destination: `${target}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${target.replace(/\/api\/?$/, '')}/uploads/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
