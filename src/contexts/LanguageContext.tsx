'use client';

import React, { createContext, useContext, useEffect, useCallback, useSyncExternalStore } from 'react';
import type { Language } from '@/types';
import arTranslations from '@/locales/ar.json';
import enTranslations from '@/locales/en.json';

type TranslationsType = typeof arTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
}

const translations: Record<Language, TranslationsType> = {
  ar: arTranslations,
  en: enTranslations,
};

// =============================================================================
// External store for language preference (backed by localStorage)
// =============================================================================
// We use `useSyncExternalStore` to read localStorage safely during SSR and
// hydration. The `getServerSnapshot` path is used during the initial server
// render AND during hydration, so server HTML and first client HTML always
// match (avoiding hydration mismatch). After hydration, React switches to
// `getSnapshot` and re-renders with the actual persisted language, if any.

const STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE: Language = 'ar';

const languageListeners = new Set<() => void>();

function readStoredLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {
    // localStorage unavailable — fall through
  }
  return DEFAULT_LANGUAGE;
}

function subscribeToLanguage(callback: () => void): () => void {
  languageListeners.add(callback);
  // Cross-tab sync via storage event
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', storageHandler);
  }
  return () => {
    languageListeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', storageHandler);
    }
  };
}

function getServerLanguageSnapshot(): Language {
  // Deterministic snapshot used on the server AND during hydration.
  return DEFAULT_LANGUAGE;
}

function persistLanguage(lang: Language) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore storage errors
  }
  languageListeners.forEach((l) => l());
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    readStoredLanguage,
    getServerLanguageSnapshot
  );

  // Sync <html lang> and <html dir> with the current language (external DOM).
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    persistLanguage(lang);
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }, [language]);

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, language, isRTL } = useLanguage();
  return { t, language, isRTL };
}
