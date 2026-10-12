import React from 'react';
import { BackgroundProvider } from './BackgroundContext';

/**
 * App-wide state. Background is its own context so a later theme context
 * can sit beside it and pass a different background map.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <BackgroundProvider>{children}</BackgroundProvider>;
}
