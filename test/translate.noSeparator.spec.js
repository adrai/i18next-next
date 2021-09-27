import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() with natural language', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en'/*, keySeparator: false */ }) // this is a new baviour, in old i18next keySeparator needed to be set to false
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            'test: with a sentence. or more text': 'test_en',
            errorCodes: {
              UNAUTHORIZED: 'Unauthorized',
              'BAD REQUEST': 'Bad request'
            }
          }
        },
        de: {
          translation: {
            'test: with a sentence. or more text': 'test_de'
          }
        }
      }))
      await i18n.init()
    })

    const tests = [
      { args: ['test: with a sentence. or more text'], expected: 'test_en' },
      {
        args: ['test: with a sentence. or more text', { lngs: ['en-US', 'en'] }],
        expected: 'test_en'
      },
      { args: ['test: with a sentence. or more text', { lngs: ['de'] }], expected: 'test_de' },
      { args: ['test: with a sentence. or more text', { lng: 'de' }], expected: 'test_de' },
      { args: ['test: with a sentence. or more text', { lng: 'fr' }], expected: 'test_en' },
      { args: ['test: with a sentence. or more text', { lng: 'en-US' }], expected: 'test_en' },
      { args: ['errorCodes.UNAUTHORIZED', { lng: 'en' }], expected: 'Unauthorized' },
      { args: ['errorCodes.BAD REQUEST', { lng: 'en' }], expected: 'Bad request' },
      { args: ['translation:errorCodes.UNAUTHORIZED', { lng: 'en' }], expected: 'Unauthorized' },
      { args: ['translation:errorCodes.BAD REQUEST', { lng: 'en' }], expected: 'Bad request' }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
