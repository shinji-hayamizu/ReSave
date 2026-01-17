import { BookOpen, Brain, Calendar, CheckCircle, RotateCcw, Tag } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const APP_VERSION = '1.0.0';

const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 180];

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        title="ReSaveについて"
        description="アプリの概要と使い方"
      />
      <div className="p-4 md:p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              アプリ情報
            </CardTitle>
            <CardDescription>基本情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">アプリ名</span>
                <span className="text-sm text-muted-foreground">ReSave</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">バージョン</span>
                <span className="text-sm text-muted-foreground">{APP_VERSION}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              ReSaveは忘却曲線に基づいた間隔反復学習アプリです。
              最適なタイミングでカードを復習することで、効率的に記憶を定着させます。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              忘却曲線と間隔反復学習
            </CardTitle>
            <CardDescription>なぜ効果的なのか</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              エビングハウスの忘却曲線によると、学習した内容は時間とともに急速に忘れられていきます。
              しかし、適切なタイミングで復習することで、記憶の定着率を大幅に向上させることができます。
            </p>
            <p className="text-sm text-muted-foreground">
              ReSaveは科学的に最適化された間隔で復習をリマインドし、
              最小の努力で最大の学習効果を得られるようサポートします。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              復習スケジュール
            </CardTitle>
            <CardDescription>固定間隔システム</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ReSaveでは以下の固定間隔で復習がスケジュールされます:
            </p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_INTERVALS.map((days) => (
                <span
                  key={days}
                  className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {days}日後
                </span>
              ))}
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">OK（覚えていた）</p>
                  <p className="text-sm text-muted-foreground">
                    次の間隔へ進みます
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="mt-0.5 h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Again（もう一度）</p>
                  <p className="text-sm text-muted-foreground">
                    最初の間隔（1日後）からやり直します
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Remembered（完全に覚えた）</p>
                  <p className="text-sm text-muted-foreground">
                    復習完了として学習キューから外れます
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              使い方ガイド
            </CardTitle>
            <CardDescription>基本的な操作方法</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">1. カードを作成する</p>
                <p className="text-sm text-muted-foreground">
                  ホーム画面の「+」ボタンから新しいカードを作成します。
                  表面に問題、裏面に答えを入力してください。
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">2. タグで整理する</p>
                <p className="text-sm text-muted-foreground">
                  カードにタグを付けて分類できます。
                  「タグ」メニューからタグの作成・管理ができます。
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">3. 毎日復習する</p>
                <p className="text-sm text-muted-foreground">
                  ホーム画面に表示される「今日の復習」から、
                  スケジュールされたカードを復習しましょう。
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">4. 継続する</p>
                <p className="text-sm text-muted-foreground">
                  毎日少しずつでも続けることが大切です。
                  ReSaveが最適なタイミングをお知らせします。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
