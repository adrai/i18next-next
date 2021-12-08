import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() with combined functionality', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            key1: 'hello world',
            key2: 'It is: {{val}}',

            // context with pluralization
            test: 'test_en',
            test_other: 'tests_en', // new plural rules
            test_male: 'test_male_en',
            test_male_other: 'tests_male_en', // new plural rules
            nestedArray: [{ a: 'b', c: 'd' }, { a: 'b', c: 'd' }],

            testNew: 'testNew_en',
            testNew_zero: 'testNew_zero_en',
            testNew_other: 'testsNew_en', // new plural rules
            testNew_male: 'testNew_male_en',
            testNew_male_zero: 'testNew_male_zero_en',
            testNew_male_other: 'testsNew_male_en' // new plural rules
          }
        }
      }))
      await i18n.init()
    })

    const tests = [
      { args: ['key2', { val: 'cool' }], expected: 'It is: cool' },

      // context with pluralization
      { args: ['test', { context: 'unknown', count: 1 }], expected: 'test_en' },
      { args: ['test', { context: 'unknown', count: 2 }], expected: 'tests_en' },
      { args: ['test', { context: 'male', count: 1 }], expected: 'test_male_en' },
      { args: ['test', { context: 'male', count: 2 }], expected: 'tests_male_en' },

      // context with zero pluralization
      { args: ['testNew', { context: 'unknown', count: 0 }], expected: 'testNew_zero_en' },
      { args: ['testNew', { context: 'unknown', count: 1 }], expected: 'testNew_en' },
      { args: ['testNew', { context: 'unknown', count: 2 }], expected: 'testsNew_en' },
      { args: ['testNew', { context: 'male', count: 0 }], expected: 'testNew_male_zero_en' },
      { args: ['testNew', { context: 'male', count: 1 }], expected: 'testNew_male_en' },
      { args: ['testNew', { context: 'male', count: 2 }], expected: 'testsNew_male_en' }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
