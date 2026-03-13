/**
 * Seed script — run with `npm run db:seed`
 * Seeds predefined tags (idempotent — safe to run multiple times).
 */
import { seedPredefinedTags } from '../src/features/playbooks/services/seed-tags';

async function main() {
  console.log('Seeding predefined tags...');
  const result = await seedPredefinedTags();
  if (result.skipped) {
    console.log('Tags already exist, skipping.');
  } else {
    console.log(`Inserted ${result.inserted} predefined tags.`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
