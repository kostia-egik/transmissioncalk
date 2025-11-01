import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// Import translations
import ru from '../i18n/ru.json';
import en from '../i18n/en.json';
import de from '../i18n/de.json';
import es from '../i18n/es.json';
import fr from '../i18n/fr.json';
import ptBR from '../i18n/pt-BR.json';
import zhCN from '../i18n/zh-CN.json';

// FIX: Export the Language type so it can be used in other components.
export type Language = 'ru' | 'en' | 'de' | 'es' | 'fr' | 'pt-BR' | 'zh-CN';
type Translations = Record<string, string>;
// FIX: Ensure TranslationKey is a string to prevent type errors when used as an index.
// `keyof` can return `string | number | symbol`, but JSON object keys are always strings.
export type TranslationKey = Extract<keyof typeof ru, string>; // Assuming ru has all keys

const translations: Record<Language, Translations> = { 
    ru, 
    en,
    de,
    es,
    fr,
    'pt-BR': ptBR,
    'zh-CN': zhCN,
};

export const LANGUAGES = [
    { code: 'ru' as Language, short: 'RU', long: 'Русский' },
    { code: 'en' as Language, short: 'EN', long: 'English' },
    { code: 'de' as Language, short: 'DE', long: 'Deutsch' },
    { code: 'es' as Language, short: 'ES', long: 'Español' },
    { code: 'fr' as Language, short: 'FR', long: 'Français' },
    { code: 'pt-BR' as Language, short: 'PT', long: 'Português (BR)' },
    { code: 'zh-CN' as Language, short: 'CN', long: '简体中文' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to get browser language or default to 'ru'
const getInitialLanguage = (): Language => {
    const browserLang = navigator.language; // e.g., 'en-US', 'zh-CN', 'fr'
    const shortLang = browserLang.split('-')[0]; // e.g., 'en', 'zh', 'fr'

    // Exact matches first
    if (LANGUAGES.some(l => l.code === browserLang)) {
        return browserLang as Language;
    }
    // Then check for short codes
    const langByShortCode = LANGUAGES.find(l => l.code === shortLang);
    if (langByShortCode) {
        return langByShortCode.code;
    }

    return 'ru'; // Default to Russian
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang && LANGUAGES.some(l => l.code === savedLang)) {
        return savedLang as Language;
    }
    return getInitialLanguage();
  });


  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = useCallback((key: TranslationKey, replacements?: Record<string, string | number>): string => {
    let translation = translations[language]?.[key] || translations['ru'][key] || String(key);
    
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
        });
    }

    return translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};