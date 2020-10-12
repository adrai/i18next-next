import i18next from 'i18next'
import intervalPlural from 'i18next-intervalplural-postprocessor'
import compatibilityLayer from '../../test/helpers/compatibilityLayer.js'

const i18n = i18next({
  debug: true,
  lng: 'en',
  fallbackLng: 'en'
}).addHook('loadResources', () => ({
  en: {
    translation: {
      key1: '{{count}} item',
      key1_plural: '{{count}} items',
      key1_interval: '(1){one item};(2-7){a few items};(7-inf){a lot of items};',
      key2: '{{count}} item',
      key2_plural: '{{count}} items',
      key2_interval: '(1){one item};(2-7){a few items};'
    }
  }
}))
.use(compatibilityLayer(intervalPlural))

i18n.init()
console.log('i18next is ready...')

console.log(i18n.t('key1_interval', { postProcess: 'interval', count: 1 })) // -> one item
console.log(i18n.t('key1_interval', { postProcess: 'interval', count: 4 })) // -> a few items
console.log(i18n.t('key1_interval', { postProcess: 'interval', count: 100 })) // -> a lot of items

// if a interval is not specified i18next fallbacks to classic plural
console.log(i18n.t('key2_interval', { postProcess: 'interval', count: 1 })) // -> one item
console.log(i18n.t('key2_interval', { postProcess: 'interval', count: 4 })) // -> a few items
console.log(i18n.t('key2_interval', { postProcess: 'interval', count: 100 })) // -> 100 items
