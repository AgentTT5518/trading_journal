'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PlaybookWithMetrics } from '../types';

interface PlaybookListProps {
  playbooks: PlaybookWithMetrics[];
}

export function PlaybookList({ playbooks }: PlaybookListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Trades</TableHead>
            <TableHead className="text-right">Win Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {playbooks.map((pb) => (
            <TableRow key={pb.id}>
              <TableCell>
                <Link href={`/playbooks/${pb.id}`} className="font-medium hover:underline">
                  {pb.name}
                </Link>
                {pb.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {pb.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {pb.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-[10px]">
                      {tag.name.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                  {pb.tags.length > 3 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{pb.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">{pb.tradeCount}</TableCell>
              <TableCell className="text-right">
                {pb.winRate !== null ? `${pb.winRate}%` : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
