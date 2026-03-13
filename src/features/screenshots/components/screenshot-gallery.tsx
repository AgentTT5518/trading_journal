'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteScreenshot } from '../services/actions';
import type { Screenshot } from '../types';

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
  tradeId: string;
}

export function ScreenshotGallery({ screenshots, tradeId }: ScreenshotGalleryProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (screenshots.length === 0) return null;

  const selected = selectedIndex !== null ? screenshots[selectedIndex] : null;

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteScreenshot(id, tradeId);
    setSelectedIndex(null);
    router.refresh();
    setDeleting(null);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {screenshots.map((ss, i) => (
          <button
            key={ss.id}
            type="button"
            onClick={() => setSelectedIndex(i)}
            className="group relative aspect-video overflow-hidden rounded-md border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/screenshots/${tradeId}/${ss.filename}`}
              alt={ss.originalName}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={() => setSelectedIndex(null)}>
        {selected && (
          <DialogContent className="max-w-3xl">
            <DialogTitle className="text-sm text-muted-foreground">
              {selected.originalName}
            </DialogTitle>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/screenshots/${tradeId}/${selected.filename}`}
              alt={selected.originalName}
              className="max-h-[70vh] w-full object-contain"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {selectedIndex !== null && selectedIndex > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedIndex(selectedIndex - 1)}>
                    Previous
                  </Button>
                )}
                {selectedIndex !== null && selectedIndex < screenshots.length - 1 && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedIndex(selectedIndex + 1)}>
                    Next
                  </Button>
                )}
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting === selected.id}
                onClick={() => handleDelete(selected.id)}
              >
                {deleting === selected.id ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
