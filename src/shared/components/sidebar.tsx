'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/trades', label: 'Trades', enabled: true },
  { href: '/dashboard', label: 'Dashboard', enabled: false },
  { href: '/journal', label: 'Journal', enabled: false },
  { href: '/playbook', label: 'Playbook', enabled: false },
  { href: '/tags', label: 'Tags', enabled: false },
  { href: '/reviews', label: 'Reviews', enabled: false },
  { href: '/settings', label: 'Settings', enabled: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-muted/30">
      <div className="flex h-14 items-center border-b px-4">
        <h1 className="text-lg font-semibold">Trading Journal</h1>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return item.enabled ? (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span
              key={item.href}
              className="block cursor-not-allowed rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/50"
            >
              {item.label}
            </span>
          );
        })}
      </nav>
    </aside>
  );
}
