import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('exists()', () => {
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
      { args: ['translation:test'], expected: true },
      { args: ['translation:test', { lngs: ['en-US', 'en'] }], expected: true },
      { args: ['translation:test', { lngs: ['de'] }], expected: true },
      { args: ['translation:test', { lng: 'de' }], expected: true },
      { args: ['translation:test', { lng: 'fr' }], expected: true },
      { args: ['translation:test', { lng: 'en-US' }], expected: true },
      { args: ['translation.test', { lng: 'en-US', nsSeparator: '.' }], expected: true },
      { args: ['translation.deep.test', { lng: 'en-US', nsSeparator: '.' }], expected: true },
      { args: ['deep.test', { lng: 'en-US', nsSeparator: '.' }], expected: true }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.exists.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
