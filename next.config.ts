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
      // Serve the Space Roguelike Windows launcher over Vercel's TLS. Chrome
      // blocks insecure HTTP .exe downloads, so we proxy the game server's
      // port-8080 download surface instead of linking to it directly.
      {
        source: "/space-roguelike/download/windows",
        destination:
          "http://143.198.244.74:8080/space-roguelike-launcher-windows-amd64.exe",
      },
    ];
  },
};

export default nextConfig;
