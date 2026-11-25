import { createContext, useContext, useState } from 'react';
import { t } from '../i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const tr = (key) => t(lang, key);
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
