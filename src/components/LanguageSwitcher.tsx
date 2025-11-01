import React, { useState, useRef, useEffect } from 'react';
// FIX: Import the 'Language' type to correctly type the language selection handler.
import { useLanguage, LANGUAGES, Language } from '../contexts/LanguageContext';

const GlobeIcon = () => (
    <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <path d="M8 4V6C8 7.10457 8.89543 8 10 8H11C12.1046 8 13 8.89543 13 10V10C13 11.1046 13.8954 12 15 12V12C16.1046 12 17 11.1046 17 10V10C17 8.89543 17.8954 8 19 8H20M20 16H17C15.8954 16 15 16.8954 15 18V20M11 20V18C11 16.8954 10.1046 16 9 16V16C7.89543 16 7 15.1046 7 14V14C7 12.8954 6.10457 12 5 12H3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
    </svg>
);

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // FIX: Update the type of 'langCode' to 'Language' to accept all available languages.
  const handleLanguageSelect = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <GlobeIcon />
        <span className="text-sm font-semibold text-gray-700">{currentLang.short}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50 animate-fade-in py-1">
          <ul>
            {LANGUAGES.map(lang => (
              <li key={lang.code}>
                <button
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm ${language === lang.code ? 'font-bold text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {lang.long}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
