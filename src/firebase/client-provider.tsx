'use client';

import { useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Or a loading spinner
  }

  return <FirebaseProvider>{children}</FirebaseProvider>;
}
