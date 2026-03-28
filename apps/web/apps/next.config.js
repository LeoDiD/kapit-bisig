/** @type {import('next').NextConfig} */
const LOCAL_API_PROXY_TARGET = 'http://127.0.0.1:3001/api'

function resolveApiProxyTarget() {
  const configured = (process.env.API_PROXY_TARGET || '').trim()
  if (!configured) return LOCAL_API_PROXY_TARGET

  const isRemoteTarget = /^https?:\/\/(?!localhost(?:[:/]|$)|127\.0\.0\.1(?:[:/]|$))/i.test(configured)
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
  async rewrites() {
    const target = resolveApiProxyTarget()
    return [
      {
        source: '/api/:path*',
        destination: `${target}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
