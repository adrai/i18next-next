import i18next from '../index.js'
import should from 'should'
import oldI18next from './helpers/oldI18next/index.js'

describe('Translator', () => {
  describe('translate() with plural', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en', compatibilityJSON: 'v3' })
      i18n.use(oldI18next)
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: 'test_en',
            test_plural: 'tests_en'
          }
        },
        'fr-FR': {
          translation: {
            test: 'test_fr',
            test_plural: 'tests_fr'
          }
        },
        de: {
          translation: {
            test: 'test_de',
            test_plural: 'tests_de'
          }
        },
        it: {
          translation: {
            test: 'test_it',
            test_plural: 'tests_it'
          }
        },
        ja: {
          translation: {
            test: 'test_ja',
            test_0: 'tests_ja'
          }
        },
        ar: {
          translation: {
            test: 'test_ar',
            test_0: 'tests_ar_zero',
            test_1: 'tests_ar_singular',
            test_2: 'tests_ar_two',
            test_3: 'tests_ar_few',
            test_4: 'tests_ar_many',
            test_5: 'tests_ar_other'
          }
        }
      }))
      await i18n.init()
    })

    const tests = [
      { args: ['translation:test', {}], expected: 'test_en' },
      { args: ['translation:test', { count: 1 }], expected: 'test_en' },
      { args: ['translation:test', { count: 2 }], expected: 'tests_en' },
      { args: ['translation:test', { count: 1, lngs: ['en-US', 'en'] }], expected: 'test_en' },
      { args: ['translation:test', { count: 2, lngs: ['en-US', 'en'] }], expected: 'tests_en' },
      { args: ['translation:test', { count: 1, lngs: ['fr-FR'] }], expected: 'test_fr' },
      { args: ['translation:test', { count: 2, lngs: ['fr-FR'] }], expected: 'tests_fr' },
      { args: ['translation:test', { count: 1, lngs: ['de'] }], expected: 'test_de' },
      { args: ['translation:test', { count: 2, lngs: ['de'] }], expected: 'tests_de' },
      { args: ['translation:test', { count: 1, lng: 'de' }], expected: 'test_de' },
      { args: ['translation:test', { count: 2, lng: 'de' }], expected: 'tests_de' },
      { args: ['translation:test', { count: 1, lng: 'fr' }], expected: 'test_en' },
      { args: ['translation:test', { count: 2, lng: 'fr' }], expected: 'tests_en' },
      { args: ['translation:test', { count: 1, lng: 'en-US' }], expected: 'test_en' },
      { args: ['translation:test', { count: 2, lng: 'en-US' }], expected: 'tests_en' },
      { args: ['translation:test', { count: 1, lng: 'ja' }], expected: 'tests_ja' },
      { args: ['translation:test', { count: 2, lng: 'ja' }], expected: 'tests_ja' },
      { args: ['translation:test', { count: 10, lng: 'ja' }], expected: 'tests_ja' },
      { args: ['translation:test', { lng: 'ar' }], expected: 'test_ar' },
      { args: ['translation:test', { count: 0, lng: 'ar' }], expected: 'tests_ar_zero' },
      { args: ['translation:test', { count: 1, lng: 'ar' }], expected: 'tests_ar_singular' },
      { args: ['translation:test', { count: 2, lng: 'ar' }], expected: 'tests_ar_two' },
      { args: ['translation:test', { count: 3, lng: 'ar' }], expected: 'tests_ar_few' },
      { args: ['translation:test', { count: 15, lng: 'ar' }], expected: 'tests_ar_many' },
      { args: ['translation:test', { count: 101, lng: 'ar' }], expected: 'tests_ar_other' },
      { args: ['translation:test', { count: 0, lng: 'it' }], expected: 'tests_it' },
      { args: ['translation:test', { count: 1, lng: 'it' }], expected: 'test_it' },
      { args: ['translation:test', { count: 2, lng: 'it' }], expected: 'tests_it' },
      { args: ['translation:test', { count: 11, lng: 'it' }], expected: 'tests_it' }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
