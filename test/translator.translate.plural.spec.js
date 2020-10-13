import i18next from '../index.js'
import should from 'should'

describe.only('Translator', () => {
  describe('translate() with plural', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: 'test_en',
            test_other: 'tests_en'
          }
        },
        de: {
          translation: {
            test: 'test_de',
            test_other: 'tests_de'
          }
        },
        ja: {
          translation: {
            test: 'test_ja',
            test_other: 'tests_ja'
          }
        }
      }))
      await i18n.init()
    })

    const tests = [
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
      { args: ['translation:test', { count: 10, lng: 'ja' }], expected: 'tests_ja' }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
