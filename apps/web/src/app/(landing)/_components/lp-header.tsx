import Link from 'next/link';

import { ReSaveIcon } from '@/components/icons/resave-icon';
import { Button } from '@/components/ui/button';

type LpHeaderProps = {
  showAuthButtons?: boolean;
};

export function LpHeader({ showAuthButtons = true }: LpHeaderProps) {
  return (
    <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ReSaveIcon size={28} className="mb-[2px]" />
          <span className="text-xl font-bold text-gray-900">ReSave</span>
        </Link>
        {showAuthButtons && (
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">ログイン</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">無料登録</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
