import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const APP_VERSION = '1.0.0';

export function AppInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>App Information</CardTitle>
        <CardDescription>About ReSave</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Version</span>
            <span className="text-sm text-muted-foreground">{APP_VERSION}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">App Name</span>
            <span className="text-sm text-muted-foreground">ReSave</span>
          </div>
        </div>
        <div className="pt-2 text-sm text-muted-foreground">
          <p>
            ReSave is a spaced repetition flashcard app based on the forgetting curve. Learn
            efficiently by reviewing cards at optimal intervals.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
