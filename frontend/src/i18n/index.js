import en from './en.json';
import si from './si.json';
import ta from './ta.json';

export const translations = { en, si, ta };

export const supportedLanguages = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
];

export function t(lang, key) {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
