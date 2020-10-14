import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() using missing', () => {
    let i18n
    let missingCalls = []

    before(async () => {
      i18n = i18next({
        lng: 'en',
        fallbackLng: 'en',
        saveMissing: true
      })
      i18n.addHook('handleMissingKey', (key, ns, lng, value, options) => {
        missingCalls.push({ key, ns, lng, value, options })
      })
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

    const tests = [{ args: ['translation:test.missing'], expected: 'test.missing' }]

    tests.forEach((test) => {
      it('correctly sends missing for ' + JSON.stringify(test.args) + ' args', () => {
        const evts = []
        i18n.on('missingKey', (lng, ns, key, value) => {
          evts.push({ lng, ns, key, value })
        })
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)

        should(evts).have.lengthOf(1)
        should(evts[0].lng).eql(['en'])
        should(evts[0].ns).eql('translation')
        should(evts[0].key).eql(test.expected)
        should(evts[0].value).eql(test.expected)

        should(missingCalls).have.lengthOf(1)
        should(missingCalls[0].lng).eql(['en'])
        should(missingCalls[0].ns).eql('translation')
        should(missingCalls[0].key).eql(test.expected)
        should(missingCalls[0].value).eql(test.expected)
        missingCalls = []
      })
    })
  })

  describe('translate() using missing with saveMissingPlurals options', () => {
    const NB_PLURALS_ARABIC = 6
    let i18n
    let doneTodos = 0

    before(async () => {
      i18n = i18next({ lng: 'ar', fallbackLng: 'ar', saveMissing: true })
      i18n.addHook('handleMissingKey', (key, ns, lng, value, options) => {
        doneTodos++
      })
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
      { args: ['translation:test.missing', { count: 10 }], expected: NB_PLURALS_ARABIC },
      { args: ['translation:test.missing', { count: 0 }], expected: NB_PLURALS_ARABIC }
    ]

    tests.forEach(test => {
      it('correctly sends missing for ' + JSON.stringify(test.args) + ' args', () => {
        let missed = 0
        i18n.on('missingKey', (lng, ns, key, value) => {
          missed++
        })
        i18n.t.apply(i18n, test.args)

        should(missed).eql(doneTodos)
        should(test.expected).eql(doneTodos)
        doneTodos = 0
      })
    })
  })
})
