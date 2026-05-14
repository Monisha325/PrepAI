import { SettingsTabs } from "@/components/dashboard/SettingsTabs";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, preferences, and subscription.
        </p>
      </div>
      <SettingsTabs />
    </div>
  );
}
