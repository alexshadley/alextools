import type { Metadata, Viewport } from 'next';
import { RegisterServiceWorker } from './components/register-sw';

export const metadata: Metadata = {
  title: 'Alcohol Tracker',
  description: 'Log drinks and estimate blood alcohol content over time',
  manifest: '/alcohol-tracker/manifest.webmanifest',
  icons: { apple: '/alcohol-tracker/icon-180.png' },
  appleWebApp: {
    capable: true,
    title: 'Drinks',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#f59e0b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function AlcoholTrackerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 [padding-bottom:env(safe-area-inset-bottom)] [padding-top:env(safe-area-inset-top)]">
      <RegisterServiceWorker />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-6">{children}</div>
    </div>
  );
}
