import Link from 'next/link';

import { ReSaveIcon } from '@/components/icons/resave-icon';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-24 text-center">
      <div className="flex justify-center mb-8">
        <ReSaveIcon size={72} />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
        忘却曲線に基づいた<br />記憶に残る学習カード
      </h1>
      <div className="w-12 h-0.5 bg-red-400 mx-auto mb-6" />
      <div className="space-y-2 mb-10">
        <p className="text-gray-600 flex items-center justify-center gap-2">
          <span className="text-green-500">✔</span>
          忘却曲線を使った学習の効率化で記憶力を大幅に向上させます
        </p>
        <p className="text-gray-600 flex items-center justify-center gap-2">
          <span className="text-green-500">✔</span>
          TODOリストを処理するような快適な操作性でご利用頂けます
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" className="rounded-full px-8" asChild>
          <Link href="/signup">無料で始める</Link>
        </Button>
        <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
          <Link href="/login">ログイン</Link>
        </Button>
      </div>
    </section>
  );
}
