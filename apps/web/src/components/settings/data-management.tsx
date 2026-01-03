import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DataManagement() {
  return (
    <Card className="opacity-60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Data Management
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            Coming in v1.3
          </span>
        </CardTitle>
        <CardDescription>Export, import, and manage your data</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Data management features will be available in a future update. You will be able to export
          your cards and learning progress, import data from other apps, and manage your account
          data.
        </p>
      </CardContent>
    </Card>
  );
}
