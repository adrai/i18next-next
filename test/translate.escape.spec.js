import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() un/escape', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: 'text {{var}}'
          }
        }
      }))
      await i18n.init()
    })

    const tests = [
      { args: ['translation:test', { var: 'a&b' }], expected: 'text a&amp;b' },
      {
        args: ['translation:test', { var: 'a&b', interpolation: { escapeValue: false } }],
        expected: 'text a&b'
      },
      { args: ['translation:test', { var: ['a', 'b'] }], expected: 'text a,b' },
      {
        args: [
          'translation:test',
          {
            var: ['a', 'b'],
            interpolation: { escape: value => value.join('-') }
          }
        ],
        expected: 'text a-b'
      }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
