import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() with context', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: 'test_en',
            test_male: 'test_male_en',
            test_female: 'test_female_en'
          }
        },
        de: {
          translation: {
            test: 'test_de',
            test_male: 'test_male_de',
            test_female: 'test_female_de'
          }
        }
      }))
      await i18n.init()
    })

    const tests = [
      { args: ['translation:test', { context: 'unknown' }], expected: 'test_en' },
      { args: ['translation:test', { context: 'male' }], expected: 'test_male_en' },
      { args: ['translation:test', { context: 'female' }], expected: 'test_female_en' },
      {
        args: ['translation:test', { context: 'male', lngs: ['en-US', 'en'] }],
        expected: 'test_male_en'
      },
      {
        args: ['translation:test', { context: 'female', lngs: ['en-US', 'en'] }],
        expected: 'test_female_en'
      },
      { args: ['translation:test', { context: 'male', lngs: ['de'] }], expected: 'test_male_de' },
      {
        args: ['translation:test', { context: 'female', lngs: ['de'] }],
        expected: 'test_female_de'
      },
      { args: ['translation:test', { context: 'male', lng: 'de' }], expected: 'test_male_de' },
      { args: ['translation:test', { context: 'female', lng: 'de' }], expected: 'test_female_de' },
      { args: ['translation:test', { context: 'male', lng: 'fr' }], expected: 'test_male_en' },
      { args: ['translation:test', { context: 'female', lng: 'fr' }], expected: 'test_female_en' },
      { args: ['translation:test', { context: 'male', lng: 'en-US' }], expected: 'test_male_en' },
      {
        args: ['translation:test', { context: 'female', lng: 'en-US' }],
        expected: 'test_female_en'
      }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
