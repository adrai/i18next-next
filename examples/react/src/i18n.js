import i18next from 'i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import compatibilityLayer from 'i18next/test/helpers/compatibilityLayer.js'

const i18n = i18next({
  debug: true,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false // not needed for react as it escapes by default
  }
}).use(compatibilityLayer(Backend))
  .use(compatibilityLayer(LanguageDetector))
  .use(compatibilityLayer(initReactI18next))

i18n.init()

export default i18n
