import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() with arrays', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: ['test_en_1', 'test_en_2', '{{myVar}}'],
            flagList: [['basic1', 'Basic1'], ['simple1', 'Simple1']],
            search: {
              flagList: [['basic', 'Basic'], ['simple', 'Simple']]
            },
            keyArray: ['hello world {{count}}', 'hey {{count}}'],
            keyArray_other: ['hello world plural {{count}}', 'hey plural {{count}}'] // new plural rules
          }
        }
      }))
      await i18n.init()
    })

    const tests = [
      { args: ['translation:test.0'], expected: 'test_en_1' },
      { args: ['translation:test.2', { myVar: 'test' }], expected: 'test' },
      {
        args: ['translation:test', { myVar: 'test', joinArrays: '+' }],
        expected: 'test_en_1+test_en_2+test'
      },
      {
        args: ['translation:test', { myVar: 'test', joinArrays: '' }],
        expected: 'test_en_1test_en_2test'
      },
      {
        args: [['search.flagList', 'flagList'], {}],
        expected: [['basic', 'Basic'], ['simple', 'Simple']]
      },
      {
        args: ['keyArray', { count: 1 }],
        expected: ['hello world 1', 'hey 1']
      },
      {
        args: ['keyArray', { count: 100 }],
        expected: ['hello world plural 100', 'hey plural 100']
      }
    ]

    tests.forEach(test => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
