'use client';

import { useState } from 'react';

import { Plus, Tags } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/page-header';
import { DeleteConfirmModal, TagFormModal, TagItem } from '@/components/tags';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCreateTag,
  useDeleteTag,
  useTags,
  useUpdateTag,
  type TagWithCardCount,
} from '@/hooks/useTags';

type ModalState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; tag: TagWithCardCount }
  | { type: 'delete'; tag: TagWithCardCount };

export default function TagsPage() {
  const { data: tags, isLoading, error } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [modalState, setModalState] = useState<ModalState>({ type: 'closed' });

  const handleOpenCreateModal = () => {
    setModalState({ type: 'create' });
  };

  const handleOpenEditModal = (tagId: string) => {
    const tag = tags?.find((t) => t.id === tagId);
    if (tag) {
      setModalState({ type: 'edit', tag });
    }
  };

  const handleOpenDeleteModal = (tagId: string) => {
    const tag = tags?.find((t) => t.id === tagId);
    if (tag) {
      setModalState({ type: 'delete', tag });
    }
  };

  const handleCloseModal = () => {
    setModalState({ type: 'closed' });
  };

  const handleCreateTag = async (data: { name: string; color: string }) => {
    try {
      await createTag.mutateAsync(data);
      toast.success('タグを作成しました');
      handleCloseModal();
    } catch (err) {
      toast.error('タグの作成に失敗しました');
    }
  };

  const handleUpdateTag = async (data: { name: string; color: string }) => {
    if (modalState.type !== 'edit') return;

    try {
      await updateTag.mutateAsync({
        id: modalState.tag.id,
        input: data,
      });
      toast.success('タグを更新しました');
      handleCloseModal();
    } catch (err) {
      toast.error('タグの更新に失敗しました');
    }
  };

  const handleDeleteTag = async () => {
    if (modalState.type !== 'delete') return;

    try {
      await deleteTag.mutateAsync(modalState.tag.id);
      toast.success('タグを削除しました');
      handleCloseModal();
    } catch (err) {
      toast.error('タグの削除に失敗しました');
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          タグの読み込みに失敗しました。ページを再読み込みしてください。
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="タグ管理"
        description="カードを整理するためのタグを管理"
        action={
          <Button onClick={handleOpenCreateModal}>
            <Plus className="h-4 w-4" />
            タグ追加
          </Button>
        }
      />
      <div className="p-4 md:p-6">
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-lg" />
          ))}
        </div>
      ) : tags && tags.length > 0 ? (
        <div className="space-y-2">
          {tags.map((tag) => (
            <TagItem
              key={tag.id}
              id={tag.id}
              name={tag.name}
              color={tag.color}
              cardCount={tag.cardCount}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-background shadow-sm">
          <EmptyState
            icon={<Tags />}
            title="タグがありません"
            description="タグを作成して、カードを整理しましょう"
          />
        </div>
      )}
      </div>

      <TagFormModal
        isOpen={modalState.type === 'create'}
        mode="create"
        onSubmit={handleCreateTag}
        onClose={handleCloseModal}
        isSubmitting={createTag.isPending}
      />

      <TagFormModal
        isOpen={modalState.type === 'edit'}
        mode="edit"
        defaultValues={
          modalState.type === 'edit'
            ? { name: modalState.tag.name, color: modalState.tag.color }
            : undefined
        }
        onSubmit={handleUpdateTag}
        onClose={handleCloseModal}
        isSubmitting={updateTag.isPending}
      />

      <DeleteConfirmModal
        isOpen={modalState.type === 'delete'}
        tagName={modalState.type === 'delete' ? modalState.tag.name : ''}
        cardCount={modalState.type === 'delete' ? modalState.tag.cardCount : 0}
        onConfirm={handleDeleteTag}
        onClose={handleCloseModal}
        isDeleting={deleteTag.isPending}
      />
    </div>
  );
}
