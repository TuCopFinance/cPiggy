'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Locale, defaultLocale } from '@/i18n/config';
import { useLanguageDetection } from '@/hooks/useLanguageDetection';

interface LanguageContextType {
  currentLocale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  isDetecting: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { detectedLocale, isDetecting, setPreferredLocale } = useLanguageDetection();
  const [currentLocale, setCurrentLocale] = React.useState<Locale>(defaultLocale);

  React.useEffect(() => {
    if (!isDetecting) {
      setCurrentLocale(detectedLocale);
    }
  }, [detectedLocale, isDetecting]);

  const setLocale = (locale: Locale) => {
    setCurrentLocale(locale);
    setPreferredLocale(locale);
  };

  const t = (key: string): string => {
    try {
      // Dynamic import of translation files
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const translations = require(`@/i18n/locales/${currentLocale}.json`);
      
      // Split the key by dots (e.g., "home.title" -> ["home", "title"])
      const keys = key.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = translations;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          // Fallback to English if translation not found
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const fallbackTranslations = require('@/i18n/locales/en.json');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let fallbackValue: any = fallbackTranslations;
          for (const fallbackKey of keys) {
            if (fallbackValue && typeof fallbackValue === 'object' && fallbackKey in fallbackValue) {
              fallbackValue = fallbackValue[fallbackKey];
            } else {
              return key; // Return the key if translation not found
            }
          }
          return fallbackValue || key;
        }
      }
      
      return value || key;
    } catch {
      // If there's an error loading translations, return the key
      return key;
    }
  };

  const value: LanguageContextType = {
    currentLocale,
    setLocale,
    t,
    isDetecting
  };

  return (
    <LanguageContext.Provider value={value}>
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
