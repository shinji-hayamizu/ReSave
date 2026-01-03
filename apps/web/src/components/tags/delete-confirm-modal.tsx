'use client';

import { Info } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  tagName: string;
  cardCount: number;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  tagName,
  cardCount,
  onConfirm,
  onClose,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>タグを削除</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>このタグを削除しますか？</p>
              <p>
                <strong className="text-foreground">{tagName}</strong>
                {' '}({cardCount}枚のカードに紐付け)
              </p>
              <div className="flex items-start gap-2.5 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  紐付いているカードは削除されません。タグの関連付けのみが解除されます。
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? '削除中...' : '削除する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
