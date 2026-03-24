'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { navItems } from './sidebar';

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const handleNavigate = useCallback(() => {
    // Delay close to allow Link click to propagate
    setTimeout(() => setOpen(false), 50);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Trading Journal</SheetTitle>
          </SheetHeader>
          <nav className="flex-1 space-y-1 p-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return item.enabled ? (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavigate}
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
        </SheetContent>
      </Sheet>
    </>
  );
}
