import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import compatibilityLayer from '../../test/helpers/compatibilityLayer.js'

const i18n = i18next({
  // initImmediate: false,
  debug: true,
  lng: 'en',
  fallbackLng: 'en',
  preload: ['en', 'de'],
  ns: ['translation'],
  defaultNS: 'translation'
}).use(compatibilityLayer(Backend, {
  loadPath: 'locales/{{lng}}/{{ns}}.json'
}))

i18n.init().then(() => {
  console.log('i18next is ready...')
  console.log(i18n.t('welcome'))
  console.log(i18n.t('welcome', { lng: 'de' }))
})
// this will only work if initImmediate is set to false, because it's async
// console.log(i18n.t('welcome'))
// console.log(i18n.t('welcome', { lng: 'de' }))
