'use client';

import { useEffect, useState } from 'react';

import { Layers, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

export default function SplashPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const minDisplayTime = new Promise((resolve) => setTimeout(resolve, 2000));
      await minDisplayTime;

      if (user) {
        router.replace('/');
      } else {
        router.replace('/login');
      }
      setIsChecking(false);
    };

    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <Layers className="h-16 w-16 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">ReSave</h1>
        </div>

        <p className="text-sm text-muted-foreground">- 記憶を科学する -</p>

        {isChecking && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">読み込み中...</span>
          </div>
        )}
      </div>
    </div>
  );
}
