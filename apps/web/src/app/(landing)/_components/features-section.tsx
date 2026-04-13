import { BookOpen, Link2, Zap } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FEATURES = [
  {
    icon: BookOpen,
    title: '科学的な復習タイミング',
    description:
      'エビングハウスの忘却曲線に基づき、1・3・7・14・30・180日の最適な間隔で復習をリマインド。最小の努力で最大の記憶定着を実現します。',
  },
  {
    icon: Link2,
    title: 'URLも一緒に保存',
    description:
      'メモにURLを紐付けて保存。後でしっかり読み返せるブックマーク＋学習カードとして使えます。読み流しを「学習」に変えます。',
  },
  {
    icon: Zap,
    title: 'シンプルな操作性',
    description:
      'TODOリストのような直感的な操作。「覚えた」「もう一度」をタップするだけで次の復習が自動スケジュールされます。',
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">ReSaveの特徴</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="border-gray-100 shadow-sm">
              <CardHeader>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
