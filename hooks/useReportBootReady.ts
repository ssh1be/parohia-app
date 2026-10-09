import { useEffect } from 'react';
import { BootTabKey, useParishScope } from '../contexts/ParishScopeContext';

/** Report when `ready` is true (initial tab fetch finished). Safe to call repeatedly. */
export function useReportBootReady(key: BootTabKey, ready: boolean) {
  const { reportBootReady } = useParishScope();

  useEffect(() => {
    if (!ready) return;
    reportBootReady(key);
  }, [ready, key, reportBootReady]);
}
