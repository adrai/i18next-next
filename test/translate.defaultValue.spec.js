import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() defaultValue', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en' })
      // i18n.addHook('loadResources', () => ({
      //   en: {
      //     translation: {}
      //   }
      // }))
      await i18n.init()
    })

    const tests = [
      { args: ['translation:test', { defaultValue: 'test_en' }], expected: 'test_en' },
      { args: ['translation:test', { defaultValue: 'test_en', count: 1 }], expected: 'test_en' },
      {
        args: [
          'translation:test',
          { defaultValue_other: 'test_en_plural', defaultValue: 'test_en', count: 10 }
        ],
        expected: 'test_en_plural'
      }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
