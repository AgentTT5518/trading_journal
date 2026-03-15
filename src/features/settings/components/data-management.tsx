'use client';

import { useActionState, useEffect, useRef, useState, startTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { clearAllTrades, importTradesFromCsv } from '../services/actions';
import type { ActionState, ImportResult } from '../types';

export function DataManagement() {
  // ─── Clear All Trades ────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [clearState, clearFormAction, clearPending] = useActionState<ActionState, FormData>(
    clearAllTrades,
    { success: false }
  );

  useEffect(() => {
    if (clearState.success) {
      toast.success(clearState.message ?? 'All trades deleted');
      startTransition(() => {
        setDialogOpen(false);
        setConfirmation('');
      });
    } else if (!clearState.success && clearState.message && clearState.message !== '') {
      toast.error(clearState.message);
    }
  }, [clearState]);

  // ─── CSV Import ───────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, importFormAction, importPending] = useActionState<
    ActionState<ImportResult>,
    FormData
  >(importTradesFromCsv, { success: false });

  useEffect(() => {
    if (importState.success) {
      toast.success(importState.message ?? 'Import complete');
      startTransition(() => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
    } else if (!importState.success && importState.message && importState.message !== '') {
      toast.error(importState.message);
    }
  }, [importState]);

  return (
    <div className="space-y-6">
      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download all your trades as a file for backup or analysis.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" render={<a href="/api/export/csv" download />}>
              Export CSV
            </Button>
            <Button variant="outline" render={<a href="/api/export/json" download />}>
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle>Import Trades (CSV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with columns:{' '}
            <code className="font-mono text-xs">
              ticker, assetClass, direction, entryDate, entryPrice, positionSize
            </code>{' '}
            (plus optional fields). Rows with errors are skipped and reported below.
          </p>

          <form action={importFormAction} className="space-y-3">
            <div>
              <Label htmlFor="file">CSV File</Label>
              <Input id="file" name="file" type="file" accept=".csv" ref={fileInputRef} />
            </div>
            <Button type="submit" disabled={importPending}>
              {importPending ? 'Importing...' : 'Import CSV'}
            </Button>
          </form>

          {importState.data && (
            <div className="rounded-md border p-4 text-sm">
              <p className="font-medium">
                Import complete: {importState.data.imported} imported,{' '}
                {importState.data.skipped} skipped
              </p>
              {importState.data.errors.length > 0 && (
                <ul className="mt-2 space-y-1 text-destructive">
                  {importState.data.errors.map((e) => (
                    <li key={e.row}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear All Trades */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently delete all trades from the database. This action cannot be undone.
          </p>
          <Button variant="destructive" onClick={() => setDialogOpen(true)}>
            Clear All Trades
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Trades?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete every trade in the database. Type{' '}
            <strong>DELETE</strong> to confirm.
          </p>
          <form action={clearFormAction} className="space-y-4">
            <div>
              <Label htmlFor="confirmation">Type DELETE to confirm</Label>
              <Input
                id="confirmation"
                name="confirmation"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                variant="destructive"
                disabled={clearPending || confirmation !== 'DELETE'}
              >
                {clearPending ? 'Deleting...' : 'Delete All Trades'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
