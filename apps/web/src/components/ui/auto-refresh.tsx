'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from './spinner';

export function AutoRefreshWhenPending({
  active,
  label = 'Checking proof...',
}: {
  active: boolean;
  label?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    const interval = window.setInterval(() => {
      router.refresh();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [active, router]);

  if (!active) return null;

  return (
    <div className="refresh-banner" role="status" aria-live="polite">
      <div className="refresh-banner-title">
        <Spinner size="md" tone="brand" />
        <span>{label}</span>
      </div>
    </div>
  );
}
