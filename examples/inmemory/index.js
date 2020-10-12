import i18next from 'i18next'

const i18n = i18next({
  initImmediate: false,
  debug: true,
  lng: 'en',
  fallbackLng: 'en'
}).addHook('loadResources', () => ({
  en: {
    translation: {
      welcome: 'hello world'
    }
  },
  de: {
    translation: {
      welcome: 'hallo welt'
    }
  }
}))

// i18n.init().then(() => {
//   console.log('i18next is ready...')
//   console.log(i18n.t('welcome'))
//   console.log(i18n.t('welcome', { lng: 'de' }))
// })

i18n.init()
console.log('i18next is ready...')
console.log(i18n.t('welcome'))
console.log(i18n.t('welcome', { lng: 'de' }))
