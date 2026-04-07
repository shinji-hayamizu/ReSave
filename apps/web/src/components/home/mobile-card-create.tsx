'use client';

import { memo, useCallback, useState } from 'react';

import { CreateCardSheet } from '@/components/home/create-card-sheet';
import { FabButton } from '@/components/home/fab-button';

interface MobileCardCreateProps {
  onCardCreated?: () => void;
}

export const MobileCardCreate = memo(function MobileCardCreate({ onCardCreated }: MobileCardCreateProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsSheetOpen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

  return (
    <>
      <FabButton isOpen={isSheetOpen} onClick={handleToggle} />
      <CreateCardSheet
        isOpen={isSheetOpen}
        onCardCreated={onCardCreated}
        onClose={handleClose}
      />
    </>
  );
});
