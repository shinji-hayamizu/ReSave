const STEPS = [
  {
    step: 1,
    title: 'カードを作成する',
    description: '覚えたいことをメモ。URLと一緒に保存することもできます。',
  },
  {
    step: 2,
    title: '毎日の復習をこなす',
    description: 'ホーム画面に「今日の復習」が表示されます。「覚えた」か「もう一度」を選ぶだけ。',
  },
  {
    step: 3,
    title: '記憶に定着させる',
    description: '最適なタイミングで復習を繰り返すことで、長期記憶として定着します。',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">使い方</h2>
        <div className="space-y-8">
          {STEPS.map(({ step, title, description }) => (
            <div key={step} className="flex gap-6 items-start">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shrink-0">
                {step}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
