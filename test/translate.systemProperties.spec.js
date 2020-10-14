import i18next from '../index.js'
import should from 'should'

// These tests orignated from issues:
//
// https://github.com/i18next/i18next/issues/906
// https://github.com/i18next/i18next-xhr-backend/issues/258
//
// should ignore non-string properties when finding 'deep' translations
// (ex: `.length`, `.search`)
// when a fallback is needed to find the actual definition of that property

describe('Translator', () => {
  describe('translate()', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'de', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: {
              length: 'test_length',
              search: 'test_search'
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

    var tests = [
      { args: ['test', { lng: 'de', nsSeparator: '.' }], expected: 'test_de' },
      { args: ['test.length', { lng: 'de', nsSeparator: '.' }], expected: 'test_length' },
      { args: ['test.search', { lng: 'de', nsSeparator: '.' }], expected: 'test_search' }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
