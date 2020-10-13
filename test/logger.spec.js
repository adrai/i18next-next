import logger from '../src/logger.js'
import should from 'should'

const mockLogger = {
  type: 'logger',

  log (args) {
    return this.output('log', args)
  },

  warn (args) {
    return this.output('warn', args)
  },

  error (args) {
    return this.output('error', args)
  },

  output (type, args) {
    return {
      type,
      args
    }
  }
}

describe('logger', () => {
  before(() => {
    logger.init(mockLogger, { debug: true })
  })

  describe('converting', () => {
    it('should log', () => {
      should(logger.log('hello').type).eql('log')
      should(logger.log('hello').args[0]).eql('i18next: hello')
    })

    it('should warn', () => {
      should(logger.warn('hello').type).eql('warn')
      should(logger.warn('hello').args[0]).eql('i18next: hello')
    })

    it('should error', () => {
      should(logger.error('hello').type).eql('error')
      should(logger.error('hello').args[0]).eql('i18next: hello')
    })

    it('should warn deprecation', () => {
      should(logger.deprecate('hello').type).eql('warn')
      should(logger.deprecate('hello').args[0]).eql('WARNING DEPRECATED: i18next: hello')
    })
  })
})
