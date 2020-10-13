import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() - fallback', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'de', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: 'test_en',
            notInDE: 'test_notInDE_en'
          }
        },
        fr: {
          translation: {
            test: 'test_fr',
            notInDE: 'test_notInDE_fr'
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
      { args: ['translation:notInDE', {}], expected: 'test_notInDE_en' },
      { args: ['translation:notInDE', { fallbackLng: 'fr' }], expected: 'test_notInDE_fr' }
    ]

    tests.forEach((test) => {
      it(`correctly translates for ${JSON.stringify(test.args)} args`, () => {
        should(i18n.t(...test.args)).eql(test.expected)
      })
    })
  })
})
