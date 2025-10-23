'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Locale, locales, localeNames, localeFlags } from '@/i18n/config';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
  className?: string;
}

export function LanguageSwitcher({ currentLocale, onLocaleChange, className = '' }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (locale: Locale) => {
    onLocaleChange(locale);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 h-9 text-xs border-gray-300 hover:border-gray-400"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{localeNames[currentLocale]}</span>
        <span className="sm:hidden">{localeFlags[currentLocale]}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-left hover:bg-gray-50 transition-colors ${
                  currentLocale === locale ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="text-base sm:text-lg">{localeFlags[locale]}</span>
                <span className="flex-1 text-xs sm:text-sm">{localeNames[locale]}</span>
                {currentLocale === locale && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

