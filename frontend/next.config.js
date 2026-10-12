/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/login",
        destination:
          "https://smart-inclusive-edapp-production.up.railway.app/api/auth/login",
      },
      {
        source: "/api/:path*",
        destination:
          "https://smart-inclusive-edapp-production.up.railway.app/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
