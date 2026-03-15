'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProfileForm } from './profile-form';
import { TradeDefaultsForm } from './trade-defaults-form';
import { DisplayPreferencesForm } from './display-preferences-form';
import { DataManagement } from './data-management';
import type { Settings } from '../types';

interface SettingsTabsProps {
  settings: Settings;
}

export function SettingsTabs({ settings }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList>
        <TabsTrigger value="profile">Trader Profile</TabsTrigger>
        <TabsTrigger value="trade-defaults">Trade Defaults</TabsTrigger>
        <TabsTrigger value="display">Display</TabsTrigger>
        <TabsTrigger value="data">Data Management</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-4">
        <ProfileForm settings={settings} />
      </TabsContent>

      <TabsContent value="trade-defaults" className="mt-4">
        <TradeDefaultsForm settings={settings} />
      </TabsContent>

      <TabsContent value="display" className="mt-4">
        <DisplayPreferencesForm settings={settings} />
      </TabsContent>

      <TabsContent value="data" className="mt-4">
        <DataManagement />
      </TabsContent>
    </Tabs>
  );
}
