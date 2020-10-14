import { extendOptions } from '../src/defaultStack.js'
import Interpolator from '../src/Interpolator.js'
import should from 'should'

describe('Interpolator', () => {
  describe('interpolate()', () => {
    let ip

    before(() => {
      ip = new Interpolator(extendOptions({ interpolation: { escapeValue: false } }).interpolation)
    })

    const tests = [
      { args: ['test', { test: '123' }], expected: 'test' },
      { args: ['test {{test}}', { test: '123' }], expected: 'test 123' },
      {
        args: ['test {{test}} a {{bit.more}}', { test: '123', bit: { more: '456' } }],
        expected: 'test 123 a 456'
      },
      { args: ['test {{ test }}', { test: '123' }], expected: 'test 123' },
      { args: ['test {{ test }}', { test: null }], expected: 'test ' },
      { args: ['test {{ test }}', { test: undefined }], expected: 'test ' },
      { args: ['test {{ test }}', {}], expected: 'test ' },
      { args: ['test {{test.deep}}', { test: { deep: '123' } }], expected: 'test 123' }
    ]

    tests.forEach((test) => {
      it('correctly interpolates for ' + JSON.stringify(test.args) + ' args', () => {
        should(ip.interpolate.apply(ip, test.args)).eql(test.expected)
      })
    })
  })

  describe('interpolate() - defaultVariables', () => {
    let ip

    before(() => {
      ip = new Interpolator(extendOptions({
        interpolation: {
          escapeValue: false,
          defaultVariables: { test: '123', bit: { more: '456' } }
        }
      }).interpolation)
    })

    const tests = [
      { args: ['test'], expected: 'test' },
      { args: ['test {{test}}'], expected: 'test 123' },
      {
        args: ['test {{test}} a {{bit.more}}'],
        expected: 'test 123 a 456'
      },
      // prio has passed in variables
      { args: ['test {{ test }}', { test: '124' }], expected: 'test 124' },
      { args: ['test {{ test }}', { test: null }], expected: 'test ' },

      // Override default variable only with null, not with undefined.
      { args: ['test {{ test }}', { test: undefined }], expected: 'test 123' }
    ]

    tests.forEach((test) => {
      it('correctly interpolates for ' + JSON.stringify(test.args) + ' args', () => {
        should(ip.interpolate.apply(ip, test.args)).eql(test.expected)
      })
    })
  })

  describe('interpolate() - options', () => {
    const tests = [
      {
        options: {},
        expected: {
          escapeValue: true,
          prefix: '{{',
          suffix: '}}',
          formatSeparator: ',',
          regexpStr: '{{(.+?)}}',
          unescapePrefix: '-'
        }
      },
      {
        description: 'uses and regex prefix and suffix and inline escapes it if necessary',
        options: {
          prefix: '(*(',
          suffix: ')*)'
        },
        expected: {
          prefix: '(*(',
          suffix: ')*)',
          // eslint-disable-next-line no-useless-escape
          regexpStr: '\\(\\*\\(\\(\\.\\+\\?\\)\\)\\*\\)'
        }
      }
    ]

    tests.forEach((test) => {
      describe(test.description || 'when called with ' + JSON.stringify(test.options), () => {
        let ip

        before(() => {
          ip = new Interpolator(extendOptions({
            interpolation: test.options
          }).interpolation)
        })

        Object.keys(test.expected).forEach(key => {
          it(key + ' is set correctly', () => {
            should(ip[key]).eql(test.expected[key])
          })
        })
      })
    })
  })

  describe('interpolate() - with formatter', () => {
    let ip

    before(() => {
      ip = new Interpolator(extendOptions({
        interpolation: {
          escapeValue: false,
          format: function (value, format, lng) {
            if (format === 'uppercase') return value.toUpperCase()
            if (format === 'lowercase') return value.toLowerCase()
            if (format === 'throw') throw new Error('Formatter error')
            return value
          }
        }
      }).interpolation)
    })

    const tests = [
      { args: ['test {{test, uppercase}}', { test: 'up' }], expected: 'test UP' },
      { args: ['test {{test, lowercase}}', { test: 'DOWN' }], expected: 'test down' }
    ]

    tests.forEach((test) => {
      it('correctly interpolates for ' + JSON.stringify(test.args) + ' args', () => {
        should(ip.interpolate.apply(ip, test.args)).eql(test.expected)
      })
    })

    it('correctly manage exception in formatter', () => {
      should(() => {
        // eslint-disable-next-line no-useless-call
        ip.interpolate.apply(ip, ['test {{test, throw}}', { test: 'up' }])
      }).throw(Error, { message: 'Formatter error' })

      const test = tests[0]

      should(ip.interpolate.apply(ip, test.args)).eql(test.expected)
    })
  })

  describe('interpolate() - with formatter using a special formatSeparator', () => {
    let ip

    before(() => {
      ip = new Interpolator(extendOptions({
        interpolation: {
          formatSeparator: '|',
          format: function (value, format, lng) {
            if (format === 'uppercase') return value.toUpperCase()
            return value
          }
        }
      }).interpolation)
    })

    const tests = [{ args: ['test {{test | uppercase}}', { test: 'up' }], expected: 'test UP' }]

    tests.forEach((test) => {
      it('correctly interpolates for ' + JSON.stringify(test.args) + ' args', () => {
        should(ip.interpolate.apply(ip, test.args)).eql(test.expected)
      })
    })
  })

  describe('interpolate() - with formatter always', () => {
    let ip

    before(() => {
      ip = new Interpolator(extendOptions({
        interpolation: {
          alwaysFormat: true,
          format: function (value, format, lng) {
            if (format === 'uppercase') return value.toUpperCase()
            return value.toLowerCase()
          }
        }
      }).interpolation)
    })

    const tests = [
      { args: ['test {{test, uppercase}}', { test: 'up' }], expected: 'test UP' },
      { args: ['test {{test}}', { test: 'DOWN' }], expected: 'test down' }
    ]

    tests.forEach((test) => {
      it('correctly interpolates for ' + JSON.stringify(test.args) + ' args', () => {
        should(ip.interpolate.apply(ip, test.args)).eql(test.expected)
      })
    })
  })

  describe('interpolate() - unescape', () => {
    let ip

    before(() => {
      ip = new Interpolator(extendOptions({}).interpolation)
    })

    const tests = [
      {
        args: ['test {{test}}', { test: '<a>foo</a>' }],
        expected: 'test &lt;a&gt;foo&lt;&#x2F;a&gt;'
      },
      {
        args: ['test {{test.deep}}', { test: { deep: '<a>foo</a>' } }],
        expected: 'test &lt;a&gt;foo&lt;&#x2F;a&gt;'
      },
      {
        args: ['test {{- test.deep}}', { test: { deep: '<a>foo</a>' } }],
        expected: 'test <a>foo</a>'
      },
      {
        args: [
          'test {{- test}} {{- test2}} {{- test3}}',
          { test: ' ', test2: '<span>test2</span>', test3: '<span>test3</span>' }
        ],
        expected: 'test   <span>test2</span> <span>test3</span>'
      },
      {
        args: ['test {{- test}}', {}],
        expected: 'test '
      },
      {
        args: ['test {{- test}}', { test: null }],
        expected: 'test '
      }
    ]

    tests.forEach((test) => {
      it('correctly interpolates for ' + JSON.stringify(test.args) + ' args', () => {
        should(ip.interpolate.apply(ip, test.args)).eql(test.expected)
      })
    })
  })

  describe('interpolate() - unescape with unescapeSuffix', () => {
    let ip

    before(() => {
      ip = new Interpolator(extendOptions({
        interpolation: {
          unescapeSuffix: '+'
        }
      }).interpolation)
    })

    const tests = [
      {
        args: ['test {{- test.deep +}}', { test: { deep: '<a>foo</a>' } }],
        expected: 'test <a>foo</a>'
      }
    ]

    tests.forEach((test) => {
      it('correctly interpolates for ' + JSON.stringify(test.args) + ' args', () => {
        should(ip.interpolate.apply(ip, test.args)).eql(test.expected)
      })
    })
  })

  describe('interpolate() - max replaced to prevent endless loop', () => {
    let ip

    before(() => {
      ip = new Interpolator(extendOptions({
        interpolation: {
          maxReplaces: 10
        }
      }).interpolation)
    })

    const tests = [
      {
        args: ['test {{test}}', { test: 'tested {{test}}' }],
        expected: 'test tested tested tested tested tested tested tested tested tested tested {{test}}'
      }
    ]

    tests.forEach((test) => {
      it('correctly interpolates for ' + JSON.stringify(test.args) + ' args', () => {
        should(ip.interpolate.apply(ip, test.args)).eql(test.expected)
      })
    })
  })

  describe('interpolate() - with undefined interpolation value', () => {
    let ip
    const tests = [{ args: ['{{test}}'], expected: '' }]

    before(() => {
      ip = new Interpolator(extendOptions({
        interpolation: {
          missingInterpolationHandler: (str, match) => {
            should(str).eql('{{test}}')
            should(match[0]).eql('{{test}}')
            should(match[1]).eql('test')
          }
        }
      }).interpolation)
    })

    tests.forEach((test) => {
      it(
        'correctly calls missingInterpolationHandler for ' + JSON.stringify(test.args) + ' args',
        () => {
          should(ip.interpolate.apply(ip, test.args)).eql(test.expected)
        }
      )
    })
  })

  describe('interpolate() - with undefined interpolation value - filled by missingInterpolationHandler', () => {
    let ip
    const tests = [{ args: ['{{test}}'], expected: 'test' }]

    before(() => {
      ip = new Interpolator(extendOptions({
        interpolation: {
          missingInterpolationHandler: (str, match) => {
            should(str).eql('{{test}}')
            should(match[0]).eql('{{test}}')
            should(match[1]).eql('test')
            return 'test'
          }
        }
      }).interpolation)
    })

    tests.forEach((test) => {
      it(
        'correctly calls missingInterpolationHandler for ' + JSON.stringify(test.args) + ' args',
        () => {
          should(ip.interpolate.apply(ip, test.args)).eql(test.expected)
        }
      )
    })

    it('correctly calls handler provided via options', () => {
      should(
        ip.interpolate('{{custom}}', {}, null, {
          missingInterpolationHandler: (str, match) => 'overridden'
        })
      ).eql('overridden')
    })
  })

  describe('interpolate() - with null interpolation value - not filled by missingInterpolationHandler', () => {
    let ip
    const tests = [{ args: ['{{test}}', { test: null }], expected: '' }]

    before(() => {
      ip = new Interpolator(extendOptions({
        interpolation: {
          missingInterpolationHandler: (str, match) => {
            return 'test'
          }
        }
      }).interpolation)
    })

    tests.forEach((test) => {
      it('correctly interpolates for ' + JSON.stringify(test.args) + ' args', () => {
        should(ip.interpolate.apply(ip, test.args)).eql(test.expected)
      })
    })
  })
})
