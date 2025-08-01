/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/file-enc-dec' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/file-enc-dec/' : '',
}

module.exports = nextConfig
