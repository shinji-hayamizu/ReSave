'use client';

import dynamic from 'next/dynamic';

const UpdatePasswordForm = dynamic(
  () => import('@/components/auth/update-password-form').then(m => m.UpdatePasswordForm),
  { ssr: false }
);

export { UpdatePasswordForm };
