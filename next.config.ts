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
      // NOTE: The Rogue Space and Dungeon Game Windows launchers are NOT
      // proxied via rewrites. Rewrites to an external URL stream the origin's
      // response verbatim, and the game servers send no Content-Disposition
      // header, so the browser named the download after the URL path
      // (extensionless). They are served by the route handlers at
      // app/space-roguelike/download/space-roguelike-launcher.exe/route.ts and
      // app/dungeon-game/download/dungeon-game-launcher.exe/route.ts, which add
      // Content-Disposition so the files save as proper .exes.
      //
      // Each game has its own release server port on the box: Space Town 80,
      // Rogue Space 8080, Dungeon Game 8081.
    ];
  },
};

export default nextConfig;
