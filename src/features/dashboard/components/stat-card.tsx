import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: string;
  trend?: 'positive' | 'negative' | 'neutral';
};

export function StatCard({ title, value, trend = 'neutral' }: StatCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            'text-2xl font-bold font-mono',
            trend === 'positive' && 'text-green-700 dark:text-green-400',
            trend === 'negative' && 'text-red-700 dark:text-red-400',
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
