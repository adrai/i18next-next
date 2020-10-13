import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() separator usage', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en', keySeparator: '::', nsSeparator: ':::' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: 'test_en',
            deep: {
              test: 'testDeep_en'
            },
            'test::single': 'single_en',
            'test.single': 'single_en'
          },
          translation2: {
            test: 'test2_en'
          }
        }
      }))
      await i18n.init()
    })

    const tests = [
      { args: ['translation:::test'], expected: 'test_en' },
      { args: ['translation2:::test'], expected: 'test2_en' },
      { args: ['translation:::deep::test'], expected: 'testDeep_en' },
      { args: ['translation:test', { nsSeparator: ':', keySeparator: '.' }], expected: 'test_en' },
      {
        args: ['translation2:test', { nsSeparator: ':', keySeparator: '.' }],
        expected: 'test2_en'
      },
      {
        args: ['translation:deep.test', { nsSeparator: ':', keySeparator: '.' }],
        expected: 'testDeep_en'
      },
      { args: ['translation:::test::single', { keySeparator: false }], expected: 'single_en' },
      { args: ['translation:::test.single', { keySeparator: false }], expected: 'single_en' }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
