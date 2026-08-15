import type { Metadata } from 'next';
import { CopyButton } from './copy-button';

export const metadata: Metadata = {
  title: 'Space Roguelike',
  description: 'Download Space Roguelike for macOS and Windows',
};

const MACOS_INSTALL_COMMAND =
  'curl -fsSL http://143.198.244.74:8080/install-macos.sh | bash';

const WINDOWS_DOWNLOAD_URL =
  '/space-roguelike/download/space-roguelike-launcher.exe';

export default function SpaceRoguelike() {
  return (
    <div className="min-h-screen bg-black text-zinc-50">
      <div className="mx-auto flex max-w-2xl flex-col gap-12 px-6 py-20">
        <header className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            Space Roguelike
          </h1>
          <p className="text-base text-zinc-400">
            A roguelike set in space. Pick your platform below to get playing.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-medium tracking-tight">macOS</h2>
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Terminal
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Open Terminal and run this command. It downloads and installs the
            latest version.
          </p>
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <code className="min-w-0 flex-1 break-all font-mono text-sm text-zinc-200">
              {MACOS_INSTALL_COMMAND}
            </code>
            <CopyButton text={MACOS_INSTALL_COMMAND} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-medium tracking-tight">Windows</h2>
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Installer
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Download the launcher and run it. It will fetch and install the
            latest version.
          </p>
          <a
            href={WINDOWS_DOWNLOAD_URL}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-zinc-50 px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
          >
            Download for Windows
            <span aria-hidden className="text-zinc-500">
              (.exe)
            </span>
          </a>
          <p className="text-xs text-zinc-600">
            64-bit Windows (amd64). If Windows SmartScreen warns you, choose
            &ldquo;More info&rdquo; then &ldquo;Run anyway.&rdquo;
          </p>
        </section>
      </div>
    </div>
  );
}
