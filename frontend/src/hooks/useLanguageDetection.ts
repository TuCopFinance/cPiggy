'use client';

import { useState, useEffect } from 'react';
import { Locale, defaultLocale, getLocaleFromCountry } from '@/i18n/config';

interface GeolocationData {
  country_code: string;
  country_name: string;
}

export function useLanguageDetection() {
  const [detectedLocale, setDetectedLocale] = useState<Locale>(defaultLocale);
  const [isDetecting, setIsDetecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectLanguage = async () => {
      try {
        // First, try to get user's saved preference from localStorage
        const savedLocale = localStorage.getItem('preferredLocale') as Locale;
        if (savedLocale && ['en', 'es'].includes(savedLocale)) {
          setDetectedLocale(savedLocale);
          setIsDetecting(false);
          return;
        }

        // Second, try to detect from browser language
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('es')) {
          setDetectedLocale('es');
          setIsDetecting(false);
          return;
        }

        // Third, try IP geolocation
        try {
          const response = await fetch('https://ipapi.co/json/');
          if (response.ok) {
            const data: GeolocationData = await response.json();
            const localeFromCountry = getLocaleFromCountry(data.country_code);
            setDetectedLocale(localeFromCountry);
          } else {
            // Fallback to browser language or default
            setDetectedLocale(browserLang.startsWith('es') ? 'es' : defaultLocale);
          }
        } catch {
          // If geolocation fails, use browser language as fallback
          setDetectedLocale(browserLang.startsWith('es') ? 'es' : defaultLocale);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to detect language');
        setDetectedLocale(defaultLocale);
      } finally {
        setIsDetecting(false);
      }
    };

    detectLanguage();
  }, []);

  const setPreferredLocale = (locale: Locale) => {
    setDetectedLocale(locale);
    localStorage.setItem('preferredLocale', locale);
  };

  return {
    detectedLocale,
    isDetecting,
    error,
    setPreferredLocale
  };
}
