import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section className="bg-primary py-16 text-center">
      <h2 className="text-2xl font-bold text-primary-foreground mb-4">
        今すぐ無料で始めましょう
      </h2>
      <p className="text-primary-foreground/80 mb-8">登録は10秒。クレジットカード不要。</p>
      <Button
        size="lg"
        variant="secondary"
        className="rounded-full px-10 text-lg font-bold"
        asChild
      >
        <Link href="/signup">無料登録する</Link>
      </Button>
    </section>
  );
}
