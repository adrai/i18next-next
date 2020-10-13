import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('getResource()', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: 'test'
          }
        }
      }))
      await i18n.init()
    })

    const tests = [
      { args: ['en', 'translation', 'test'], expected: 'test' },
      { args: ['de', 'translation', 'test'], expected: undefined }
    ]

    tests.forEach(test => {
      it('correctly gets resource for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.getResource.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
