import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ParishScopeContextValue = {
  /** Increments whenever the signed-in user's parish membership changes. */
  parishEpoch: number;
  bumpParishEpoch: () => void;
};

const ParishScopeContext = createContext<ParishScopeContextValue | undefined>(undefined);

export function ParishScopeProvider({ children }: { children: React.ReactNode }) {
  const [parishEpoch, setParishEpoch] = useState(0);
  const bumpParishEpoch = useCallback(() => {
    setParishEpoch((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ parishEpoch, bumpParishEpoch }),
    [parishEpoch, bumpParishEpoch],
  );

  return (
    <ParishScopeContext.Provider value={value}>{children}</ParishScopeContext.Provider>
  );
}

export function useParishScope() {
  const ctx = useContext(ParishScopeContext);
  if (!ctx) {
    throw new Error('useParishScope must be used within a ParishScopeProvider');
  }
  return ctx;
}
