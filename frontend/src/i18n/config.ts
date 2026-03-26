import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// Import locale files
import commonEn from './locales/en/common.json';
import authEn from './locales/en/auth.json';
import scanEn from './locales/en/scan.json';
import dashboardEn from './locales/en/dashboard.json';
import clinicalEn from './locales/en/clinical.json';
import chatEn from './locales/en/chat.json';

i18n.use(initReactI18next).init({
  resources: { en: { common: commonEn, auth: authEn, scan: scanEn, dashboard: dashboardEn, clinical: clinicalEn, chat: chatEn } },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});
export default i18n;
