import type { InferSelectModel } from 'drizzle-orm';
import type { screenshots } from '@/lib/db/schema';

export type Screenshot = InferSelectModel<typeof screenshots>;
