import { LpHeader } from '@/app/(landing)/_components/lp-header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <LpHeader showAuthButtons={false} />
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md px-4">{children}</div>
      </div>
    </div>
  );
}
