
'use client';
import type { UserProfile } from '@/actions/auth';
import React, { createContext, useContext } from 'react';

interface SessionContextType {
  userProfile: UserProfile | null;
  // TODO: Consider adding a refresh function if client-side actions need to trigger a global session state update.
  // This would likely involve re-fetching from the server or having server actions return updated UserProfile.
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode; value: UserProfile | null }> = ({ children, value }) => {
  return <SessionContext.Provider value={{ userProfile: value }}>{children}</SessionContext.Provider>;
};

export const useUserSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useUserSession must be used within a SessionProvider');
  }
  return context;
};
