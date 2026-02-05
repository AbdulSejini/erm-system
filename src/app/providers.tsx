'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ImpersonationProvider } from '@/contexts/ImpersonationContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <LanguageProvider>
          <ImpersonationProvider>
            {children}
          </ImpersonationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
