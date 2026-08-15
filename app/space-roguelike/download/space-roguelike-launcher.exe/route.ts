// Serves the Space Roguelike Windows launcher over Vercel's TLS. Chrome blocks
// insecure HTTP .exe downloads, so we cannot link to the game server directly.
//
// A plain next.config rewrite to the origin doesn't work either: it streams the
// origin's response verbatim, and the game server sends no Content-Disposition
// header, so the browser names the saved file after the request path. This
// handler proxies the bytes and sets Content-Disposition itself so the download
// is saved as a proper .exe. The route folder is named after the filename so
// the URL fallback is sane even if a client ignores the header.

const ORIGIN =
  'http://143.198.244.74:8080/space-roguelike-launcher-windows-amd64.exe';
// The name the browser saves the download as, via Content-Disposition. Decoupled
// from the origin's build-artifact name so it reads as a friendly product name.
const FILENAME = 'Space Roguelike Launcher.exe';

// Never cache a 70+ MB binary at the edge; always stream from the origin.
export const dynamic = 'force-dynamic';

export async function GET() {
  const upstream = await fetch(ORIGIN);

  if (!upstream.ok || !upstream.body) {
    return new Response('Download is temporarily unavailable.', {
      status: 502,
    });
  }

  const headers = new Headers();
  headers.set('Content-Type', 'application/octet-stream');
  headers.set('Content-Disposition', `attachment; filename="${FILENAME}"`);

  const contentLength = upstream.headers.get('content-length');
  if (contentLength) headers.set('Content-Length', contentLength);

  // Stream the origin body straight through — no buffering.
  return new Response(upstream.body, { status: 200, headers });
}
