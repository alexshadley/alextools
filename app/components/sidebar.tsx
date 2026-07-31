'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/inventories/home', label: 'Home' },
  { href: '/inventories', label: 'Inventories' },
];

export function Sidebar() {
  const pathname = usePathname();

  // The item whose href is the longest prefix of the current path is active,
  // so /inventories/home highlights Home rather than both Home and Inventories.
  const activeHref = items
    .filter(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
    )
    .reduce<string | null>(
      (best, item) =>
        best === null || item.href.length > best.length ? item.href : best,
      null,
    );

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 px-3 py-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="px-3 pb-6 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Alextools
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                'rounded-md px-3 py-2 text-sm transition-colors ' +
                (active
                  ? 'bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50')
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
