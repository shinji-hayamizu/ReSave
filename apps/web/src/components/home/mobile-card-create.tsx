'use client';

import { memo, useCallback, useState } from 'react';

import { CreateCardDialog } from '@/components/cards/create-card-dialog';
import { FabButton } from '@/components/home/fab-button';

interface MobileCardCreateProps {
  onCardCreated?: () => void;
}

export const MobileCardCreate = memo(function MobileCardCreate({ onCardCreated }: MobileCardCreateProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
  }, []);

  return (
    <>
      <FabButton isOpen={isDialogOpen} onClick={handleOpen} />
      <CreateCardDialog
        open={isDialogOpen}
        onCardCreated={onCardCreated}
        onOpenChange={handleOpenChange}
      />
    </>
  );
});
