import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() in cimode', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'cimode', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: 'test_en'
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
      {
        args: [
          'translation:test',
          { appendNamespaceToCIMode: false, ns: 'translation', nsSeparator: ':' }
        ],
        expected: 'test'
      },
      {
        args: ['test', { appendNamespaceToCIMode: false, ns: 'translation', nsSeparator: ':' }],
        expected: 'test'
      },
      {
        args: [
          'translation:test',
          { appendNamespaceToCIMode: true, ns: 'translation', nsSeparator: ':' }
        ],
        expected: 'translation:test'
      },
      {
        args: ['test', { appendNamespaceToCIMode: true, ns: 'translation', nsSeparator: ':' }],
        expected: 'translation:test'
      }
    ]

    tests.forEach((test) => {
      it('correctly return key for ' + JSON.stringify(test.args) + ' args in cimode', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
