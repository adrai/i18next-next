import i18next from 'i18next'
import ICU from 'i18next-icu'
import compatibilityLayer from '../../test/helpers/compatibilityLayer.js'

const i18n = i18next({
  debug: true,
  lng: 'en',
  fallbackLng: 'en'
}).addHook('loadResources', () => ({
  en: {
    translation: {
      key:
        'You have {numPhotos, plural, ' +
        '=0 {no photos.}' +
        '=1 {one photo.}' +
        'other {# photos.}}'
    }
  }
})).use(compatibilityLayer(ICU))

i18n.init()
console.log('i18next is ready...')
console.log(i18n.t('key', { numPhotos: 0 })) // You have no photos.
console.log(i18n.t('key', { numPhotos: 1 })) // You have one photo.
console.log(i18n.t('key', { numPhotos: 1000 })) // You have 1,000 photos.
