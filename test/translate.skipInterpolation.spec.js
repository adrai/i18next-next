import i18next from '../index.js'
import should from 'should'

describe('Translator', () => {
  describe('translate() skip interpolation', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: 'test_en {{key}}',
            deep: {
              arr: ['deep_en arr {{key1}}', 'deep_en arr {{key2}}']
            }
          }
        },
        de: {
          translation: {
            test: 'test_de {{key}}'
          }
        }
      }))
      await i18n.init()
    })

    const tests = [
      { args: ['translation:test', { skipInterpolation: true }], expected: 'test_en {{key}}' },
      {
        args: ['translation:test', { skipInterpolation: false, key: 'value' }],
        expected: 'test_en value'
      },
      {
        args: ['translation:test', { lng: 'de', skipInterpolation: true }],
        expected: 'test_de {{key}}'
      },
      {
        args: ['translation:test', { lng: 'fr', skipInterpolation: true }],
        expected: 'test_en {{key}}'
      },
      {
        args: ['translation:deep', { returnObjects: true, skipInterpolation: true }],
        expected: { arr: ['deep_en arr {{key1}}', 'deep_en arr {{key2}}'] }
      },
      {
        args: [
          'translation:deep',
          { returnObjects: true, skipInterpolation: false, key1: 'value1', key2: 'value2' }
        ],
        expected: { arr: ['deep_en arr value1', 'deep_en arr value2'] }
      },
      {
        args: ['translation:deep.arr', { joinArrays: ' + ', skipInterpolation: true }],
        expected: 'deep_en arr {{key1}} + deep_en arr {{key2}}'
      },
      {
        args: [
          'translation:deep.arr',
          { joinArrays: ' + ', skipInterpolation: false, key1: '1', key2: '2' }
        ],
        expected: 'deep_en arr 1 + deep_en arr 2'
      }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })

  describe('translate() skip interpolation should allow post process', () => {
    let i18n

    before(async () => {
      i18n = i18next({ lng: 'en', fallbackLng: 'en' })
      i18n.addHook('loadResources', () => ({
        en: {
          translation: {
            test: 'test_en',
            simpleArr: ['simpleArr_en 1', 'simpleArr_en 2']
          }
        },
        de: {
          translation: {
            test: 'test_de'
          }
        }
      }))
      i18n.addHook('postProcess', 'postProcessValue', (value) => 'post processed: ' + value)
      await i18n.init()
    })

    const tests = [
      {
        args: ['translation:test', { skipInterpolation: true, postProcess: 'postProcessValue' }],
        expected: 'post processed: test_en'
      },
      {
        args: ['translation:test', { skipInterpolation: false, postProcess: 'postProcessValue' }],
        expected: 'post processed: test_en'
      },
      {
        args: [
          'translation:simpleArr',
          { skipInterpolation: true, postProcess: 'postProcessValue' }
        ],
        expected: ['post processed: simpleArr_en 1', 'post processed: simpleArr_en 2']
      },
      {
        args: [
          'translation:simpleArr',
          { skipInterpolation: false, postProcess: 'postProcessValue' }
        ],
        expected: ['post processed: simpleArr_en 1', 'post processed: simpleArr_en 2']
      },
      {
        args: [
          'translation:simpleArr',
          { joinArrays: ' + ', skipInterpolation: true, postProcess: 'postProcessValue' }
        ],
        expected: 'post processed: simpleArr_en 1 + simpleArr_en 2'
      },
      {
        args: [
          'translation:simpleArr',
          { joinArrays: ' + ', skipInterpolation: false, postProcess: 'postProcessValue' }
        ],
        expected: 'post processed: simpleArr_en 1 + simpleArr_en 2'
      }
    ]

    tests.forEach((test) => {
      it('correctly translates for ' + JSON.stringify(test.args) + ' args', () => {
        should(i18n.t.apply(i18n, test.args)).eql(test.expected)
      })
    })
  })
})
