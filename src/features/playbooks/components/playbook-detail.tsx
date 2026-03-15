'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { categoryColors, formatTagName } from './tag-selector';
import type { PlaybookWithMetrics, TagCategory } from '../types';

interface PlaybookDetailProps {
  playbook: PlaybookWithMetrics;
}

export function PlaybookDetail({ playbook }: PlaybookDetailProps) {
  return (
    <div className="space-y-6">
      {/* Metrics summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Linked Tags</p>
            <p className="text-2xl font-bold">{playbook.tags.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Trades</p>
            <p className="text-2xl font-bold">{playbook.tradeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">
              {playbook.winRate !== null ? `${playbook.winRate}%` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {playbook.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{playbook.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Rules */}
      <div className="grid gap-4 sm:grid-cols-2">
        {playbook.entryRules && (
          <Card>
            <CardHeader>
              <CardTitle>Entry Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{playbook.entryRules}</p>
            </CardContent>
          </Card>
        )}

        {playbook.exitRules && (
          <Card>
            <CardHeader>
              <CardTitle>Exit Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{playbook.exitRules}</p>
            </CardContent>
          </Card>
        )}

        {playbook.marketConditions && (
          <Card>
            <CardHeader>
              <CardTitle>Market Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{playbook.marketConditions}</p>
            </CardContent>
          </Card>
        )}

        {playbook.positionSizingRules && (
          <Card>
            <CardHeader>
              <CardTitle>Position Sizing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{playbook.positionSizingRules}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Linked Tags */}
      {playbook.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Linked Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {playbook.tags.map((tag) => (
                <span
                  key={tag.id}
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[tag.category as TagCategory] ?? 'bg-muted text-muted-foreground'}`}
                >
                  {formatTagName(tag.name)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
