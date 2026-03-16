'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BookOpen,
  BookMarked,
  Tags,
  ClipboardCheck,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const navItems: { href: string; label: string; enabled: boolean; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', enabled: true, icon: LayoutDashboard },
  { href: '/trades', label: 'Trades', enabled: true, icon: ArrowLeftRight },
  { href: '/journal', label: 'Journal', enabled: true, icon: BookOpen },
  { href: '/playbooks', label: 'Playbooks', enabled: true, icon: BookMarked },
  { href: '/tags', label: 'Tags', enabled: true, icon: Tags },
  { href: '/reviews', label: 'Reviews', enabled: true, icon: ClipboardCheck },
  { href: '/settings', label: 'Settings', enabled: true, icon: Settings },
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
          const Icon = item.icon;
          return item.enabled ? (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          ) : (
            <span
              key={item.href}
              className="flex items-center gap-2 cursor-not-allowed rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/50"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </span>
          );
        })}
      </nav>
    </aside>
  );
}
