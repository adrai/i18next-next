import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() using updateMissing', () => {
    let i18n
    let updateCalls = []

    before(async () => {
      i18n = i18next({
        lng: 'en',
        fallbackLng: 'en',
        updateMissing: true
      })
      i18n.addHook('handleUpdateKey', (key, ns, lng, value, options) => {
        updateCalls.push({ key, ns, lng, value, options })
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

    const tests = [{ args: ['translation:test', { defaultValue: 'new value' }], expected: 'test_en' }]

    tests.forEach((test) => {
      it('correctly sends missing for ' + JSON.stringify(test.args) + ' args', () => {
        const evts = []
        i18n.on('updateKey', (lng, ns, key, value) => {
          evts.push({ lng, ns, key, value })
        })
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)

        should(evts).have.lengthOf(1)
        should(evts[0].lng).eql(['en'])
        should(evts[0].ns).eql('translation')
        should(evts[0].key).eql('test')
        should(evts[0].value).eql('new value')

        should(updateCalls).have.lengthOf(1)
        should(updateCalls[0].lng).eql(['en'])
        should(updateCalls[0].ns).eql('translation')
        should(updateCalls[0].key).eql('test')
        should(updateCalls[0].value).eql('new value')
        updateCalls = []
      })
    })
  })
})
