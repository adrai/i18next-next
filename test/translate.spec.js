import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate()', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: 'test_en',
            deep: {
              test: 'deep_en'
            }
          }
        },
        de: {
          translation: {
            test: 'test_de'
          }
        }
      }))
      await i18n.init()
    })

    const tests = [
      { args: ['translation:test'], expected: 'test_en' },
      { args: ['translation:test', { lngs: ['en-US', 'en'] }], expected: 'test_en' },
      { args: ['translation:test', { lngs: ['de'] }], expected: 'test_de' },
      { args: ['translation:test', { lng: 'de' }], expected: 'test_de' },
      { args: ['translation:test', { lng: 'fr' }], expected: 'test_en' },
      { args: ['translation:test', { lng: 'en-US' }], expected: 'test_en' },
      { args: ['translation.test', { lng: 'en-US', nsSeparator: '.' }], expected: 'test_en' },
      { args: ['translation.deep.test', { lng: 'en-US', nsSeparator: '.' }], expected: 'deep_en' },
      { args: ['deep.test', { lng: 'en-US', nsSeparator: '.' }], expected: 'deep_en' }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
