import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() with plural', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: 'test_en_without_count',
            test_one: 'test_en',
            test_other: 'tests_en'
          }
        },
        de: {
          translation: {
            test: 'test_de',
            test_other: 'tests_de'
          }
        },
        it: {
          translation: {
            test: 'test_it',
            test_other: 'tests_it_other',
            test_many: 'tests_it_many' // ordinal
          }
        },
        ja: {
          translation: {
            test: 'test_ja',
            test_other: 'tests_ja'
          }
        },
        ar: {
          translation: {
            test: 'test_ar',
            test_few: 'tests_ar_few',
            test_many: 'tests_ar_many',
            test_one: 'tests_ar_one', // this could also be skippet, when test key is there without plural form (it's the fallback)
            test_two: 'tests_ar_two',
            test_zero: 'tests_ar_zero',
            test_other: 'tests_ar_other'
          }
        }
      }))
      await i18n.init()
    })

    const tests = [
      { args: ['translation:test', {}], expected: 'test_en_without_count' },
      { args: ['translation:test', { count: 1 }], expected: 'test_en' },
      { args: ['translation:test', { count: 2 }], expected: 'tests_en' },
      { args: ['translation:test', { count: 1, lngs: ['en-US', 'en'] }], expected: 'test_en' },
      { args: ['translation:test', { count: 2, lngs: ['en-US', 'en'] }], expected: 'tests_en' },
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
      { args: ['translation:test', { count: 1, lng: 'ar' }], expected: 'tests_ar_one' },
      { args: ['translation:test', { count: 2, lng: 'ar' }], expected: 'tests_ar_two' },
      { args: ['translation:test', { count: 3, lng: 'ar' }], expected: 'tests_ar_few' },
      { args: ['translation:test', { count: 15, lng: 'ar' }], expected: 'tests_ar_many' },
      { args: ['translation:test', { count: 101, lng: 'ar' }], expected: 'tests_ar_other' },
      { args: ['translation:test', { count: 0, lng: 'ar', ordinal: true }], expected: 'tests_ar_other' },
      { args: ['translation:test', { count: 1, lng: 'ar', ordinal: true }], expected: 'tests_ar_other' },
      { args: ['translation:test', { count: 2, lng: 'ar', ordinal: true }], expected: 'tests_ar_other' },
      { args: ['translation:test', { count: 3, lng: 'ar', ordinal: true }], expected: 'tests_ar_other' },
      { args: ['translation:test', { count: 15, lng: 'ar', ordinal: true }], expected: 'tests_ar_other' },
      { args: ['translation:test', { count: 0, lng: 'it' }], expected: 'tests_it_other' },
      { args: ['translation:test', { count: 1, lng: 'it' }], expected: 'test_it' },
      { args: ['translation:test', { count: 2, lng: 'it' }], expected: 'tests_it_other' },
      { args: ['translation:test', { count: 11, lng: 'it' }], expected: 'tests_it_other' },
      { args: ['translation:test', { count: 0, lng: 'it', ordinal: true }], expected: 'tests_it_other' },
      { args: ['translation:test', { count: 1, lng: 'it', ordinal: true }], expected: 'tests_it_other' },
      { args: ['translation:test', { count: 2, lng: 'it', ordinal: true }], expected: 'tests_it_other' },
      { args: ['translation:test', { count: 11, lng: 'it', ordinal: true }], expected: 'tests_it_many' }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
