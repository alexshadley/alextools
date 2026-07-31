import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Mirror the Space Town game server's HTTP surface 1:1 under
      // /space-town, served over Vercel's TLS (Chrome blocks insecure HTTP
      // .zip/.exe downloads). The download page lives at /space-town/download.
      // The game's realtime UDP traffic goes straight to the server and is
      // intentionally NOT proxied here.
      { source: "/space-town/:path*", destination: "http://143.198.244.74/:path*" },
    ];
  },
};

export default nextConfig;
