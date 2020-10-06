// @ts-ignore
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts'
// @ts-ignore
import i18next from '../../index.js'
// @ts-ignore
const { test } = Deno

test('onExtendOptions', async () => {
  // before
  const i18nextInstance = i18next({ lng: 'en', some: 'options' })
  i18nextInstance.addHook('extendOptions', () => {
    return { add: 'this' }
  })
  i18nextInstance.addHook('extendOptions', () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ another: 'thing' }), 50)
    })
  })
  i18nextInstance.addHook('loadResources', () => ({
    en: {
      translation: {
        'a key': 'a value'
      }
    }
  }))
  await i18nextInstance.init()
  assertEquals(i18nextInstance.options, {
    some: 'options',
    add: 'this',
    another: 'thing',
    pluralOptionProperty: 'count',
    debug: false,
    defaultNS: 'translation',
    lng: 'en'
  })
  const translated = i18nextInstance.t('a key')
  assertEquals(translated, 'a value')
})
