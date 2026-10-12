/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://smart-inclusive-edapp-production.up.railway.app/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
