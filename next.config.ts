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
      // NOTE: The Space Roguelike Windows launcher is NOT proxied via a rewrite.
      // Rewrites to an external URL stream the origin's response verbatim, and
      // the game server sends no Content-Disposition header, so the browser
      // named the download after the URL path (extensionless). It is served by
      // the route handler at
      // app/space-roguelike/download/space-roguelike-launcher.exe/route.ts,
      // which adds Content-Disposition so the file saves as a proper .exe.
    ];
  },
};

export default nextConfig;
