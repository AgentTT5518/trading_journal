import { Sidebar } from '@/shared/components/sidebar';
import { MobileSidebar } from '@/shared/components/mobile-sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Mobile header */}
      <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
        <MobileSidebar />
        <h1 className="text-lg font-semibold">Trading Journal</h1>
      </header>

      {/* Desktop sidebar */}
      <Sidebar />

      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
