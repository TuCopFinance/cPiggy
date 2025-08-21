# 🌍 Multi-Language Implementation for cPiggyFX

## Overview

This document describes the implementation of multi-language support (English/Spanish) for cPiggyFX, including automatic language detection based on IP location, browser preferences, and manual user override.

## Features Implemented

### ✅ Automatic Language Detection
- **IP Geolocation**: Detects user's country and sets appropriate language
- **Browser Language**: Falls back to browser's preferred language
- **Smart Fallbacks**: Defaults to English for unknown countries
- **Country Mapping**: Colombia and other Spanish-speaking countries → Spanish

### ✅ User Control
- **Language Switcher**: Manual language selection with flag icons
- **Persistent Storage**: User preferences saved in localStorage
- **Real-time Updates**: Immediate language changes across the app
- **Visual Feedback**: Clear indication of current language

### ✅ Translation Coverage
- **Complete UI**: All text elements translated
- **Contextual**: Different translations for different sections
- **Fallback System**: English fallback if translation missing
- **Maintainable**: JSON-based translation files

## Technical Implementation

### 1. Language Configuration (`src/i18n/config.ts`)
```typescript
export const locales = ['en', 'es'] as const;
export const countryToLocale: Record<string, Locale> = {
  'CO': 'es', // Colombia
  'ES': 'es', // Spain
  'MX': 'es', // Mexico
  'US': 'en', // United States
  // ... more countries
};
```

### 2. Language Detection Hook (`src/hooks/useLanguageDetection.ts`)
```typescript
export function useLanguageDetection() {
  // Priority order:
  // 1. User's saved preference (localStorage)
  // 2. Browser language
  // 3. IP geolocation
  // 4. Default to English
}
```

### 3. Language Context (`src/context/LanguageContext.tsx`)
```typescript
interface LanguageContextType {
  currentLocale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string; // Translation function
  isDetecting: boolean;
}
```

### 4. Language Switcher Component (`src/components/LanguageSwitcher.tsx`)
- Dropdown with flag icons
- Current language indicator
- Smooth animations
- Mobile-responsive design

## Translation Files

### English (`src/i18n/locales/en.json`)
```json
{
  "home": {
    "title": "🐷 cPiggyFX: Diversified FX Piggy Bank",
    "subtitle": "Save in cCOP, grow in the world.",
    "description": "A decentralized savings application..."
  }
}
```

### Spanish (`src/i18n/locales/es.json`)
```json
{
  "home": {
    "title": "🐷 cPiggyFX: Alcancía FX Diversificada",
    "subtitle": "Ahorra en cCOP, crece en el mundo.",
    "description": "Una aplicación de ahorros descentralizada..."
  }
}
```

## Usage Examples

### Basic Translation
```tsx
import { useLanguage } from '@/context/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  
  return <h1>{t('home.title')}</h1>;
}
```

### Language Switching
```tsx
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function Header() {
  const { currentLocale, setLocale } = useLanguage();
  
  return (
    <LanguageSwitcher 
      currentLocale={currentLocale} 
      onLocaleChange={setLocale} 
    />
  );
}
```

## Language Detection Priority

1. **User Preference** (localStorage) - Highest priority
2. **Browser Language** - Second priority
3. **IP Geolocation** - Third priority
4. **Default Language** (English) - Fallback

## Country-to-Language Mapping

| Country | Language | Code |
|---------|----------|------|
| Colombia | Spanish | CO |
| Spain | Spanish | ES |
| Mexico | Spanish | MX |
| Argentina | Spanish | AR |
| Peru | Spanish | PE |
| Chile | Spanish | CL |
| United States | English | US |
| United Kingdom | English | GB |
| Canada | English | CA |
| Australia | English | AU |

## Demo Page

Visit `/demo` to see the language switching in action:
- Real-time language switching
- Translation examples for all sections
- Technical implementation details
- Feature showcase

## Future Enhancements

### 🚀 Planned Features
- **More Languages**: Portuguese (Brazil), French (Canada)
- **RTL Support**: Arabic, Hebrew
- **Dynamic Loading**: Load translations on-demand
- **A/B Testing**: Language-based user experience testing

### 🔧 Technical Improvements
- **Translation Memory**: Cache frequently used translations
- **Pluralization**: Handle different plural forms
- **Number Formatting**: Locale-specific number formats
- **Date Formatting**: Locale-specific date formats

## Testing

### Manual Testing
1. Visit the app from different countries (use VPN)
2. Change browser language settings
3. Use the language switcher
4. Check localStorage persistence

### Automated Testing
```bash
npm run build  # Check for TypeScript/ESLint errors
npm run dev    # Test in development mode
```

## Performance Considerations

- **Bundle Size**: Translation files are loaded dynamically
- **Memory Usage**: Minimal overhead for language context
- **Network**: IP geolocation uses external service (ipapi.co)
- **Caching**: User preferences cached in localStorage

## Security Notes

- **IP Geolocation**: Uses public service (ipapi.co)
- **Local Storage**: User preferences only, no sensitive data
- **Fallbacks**: Graceful degradation if services fail
- **Error Handling**: Comprehensive error handling throughout

## Troubleshooting

### Common Issues
1. **Language not detected**: Check browser language settings
2. **Translations missing**: Verify translation file structure
3. **Build errors**: Check ESLint and TypeScript configuration
4. **Performance issues**: Monitor bundle size and loading times

### Debug Mode
```typescript
// Add to any component for debugging
const { currentLocale, isDetecting } = useLanguage();
console.log('Current locale:', currentLocale);
console.log('Detecting:', isDetecting);
```

## Conclusion

The multi-language implementation provides a seamless, user-friendly experience for cPiggyFX users worldwide. With automatic detection, manual override options, and comprehensive translation coverage, users can interact with the app in their preferred language while maintaining the ability to switch languages as needed.

The implementation is production-ready, performant, and easily extensible for future language additions.

