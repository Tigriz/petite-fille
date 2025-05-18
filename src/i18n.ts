import i18next from 'i18next';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

i18next.init({
  lng: 'en', // default language
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
});

export type SupportedLocale = 'en' | 'fr';

export function setLocale(locale: SupportedLocale) {
  i18next.changeLanguage(locale);
}

export function t(key: string, params: Record<string, string | number> = {}): string {
  return i18next.t(key, params);
}

export default i18next; 