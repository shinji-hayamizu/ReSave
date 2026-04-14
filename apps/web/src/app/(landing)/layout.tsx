import { LpFooter } from './_components/lp-footer';
import { LpHeader } from './_components/lp-header';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LpHeader />
      <main className="flex-1">{children}</main>
      <LpFooter />
    </div>
  );
}
