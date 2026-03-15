import { PageHeader } from '@/shared/components/page-header';
import { getSettings } from '@/features/settings/services/queries';
import { SettingsTabs } from '@/features/settings/components/settings-tabs';

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your trader profile and app preferences" />
      <SettingsTabs settings={settings} />
    </div>
  );
}
