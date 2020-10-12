import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import compatibilityLayer from '../../test/helpers/compatibilityLayer.js'

const i18n = i18next({
  // initImmediate: false, // initImmediate = false will make sure you can use t function imediately after init call (without waiting for its completion)
  debug: true,
  lng: 'en',
  fallbackLng: 'en',
  preload: ['en', 'de']
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
