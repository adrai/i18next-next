import EventEmitter from '../src/EventEmitter.js'
import should from 'should'

describe('i18next', () => {
  describe('published', () => {
    let emitter
    beforeEach(() => {
      emitter = new EventEmitter()
    })

    it('it should emit', done => {
      // test on
      emitter.on('ok', payload => {
        should(payload).eql('data ok')
        done()
      })

      // test off
      const nok = payload => {
        should(payload).eql('not called as off')
        done()
      }
      emitter.on('nok', nok)
      emitter.off('nok', nok)

      emitter.emit('nok', 'there should be no listener')
      emitter.emit('ok', 'data ok')
    })

    it('it should emit wildcard', done => {
      // test on
      emitter.on('*', (name, payload) => {
        should(name).eql('ok')
        should(payload).eql('data ok')
        done()
      })

      emitter.emit('ok', 'data ok')
    })

    it('it should emit with array params', done => {
      // test on
      emitter.on('array-event', (array, data) => {
        should(array).eql(['array ok 1', 'array ok 2'])
        should(data).eql('data ok')
        done()
      })

      emitter.emit('array-event', ['array ok 1', 'array ok 2'], 'data ok')
    })

    it('it should emit wildcard with array params', done => {
      // test on
      emitter.on('*', (ev, array, data) => {
        should(ev).eql('array-event')
        should(array).eql(['array ok 1', 'array ok 2'])
        should(data).eql('data ok')
        done()
      })

      emitter.emit('array-event', ['array ok 1', 'array ok 2'], 'data ok')
    })

    it('it should return itself', () => {
      // test on
      const returned = emitter.on('*')

      should(returned).eql(emitter)
    })

    it('it should correctly unbind observers', () => {
      const calls1 = []
      const listener1 = payload => {
        calls1.push(payload)
      }

      const calls2 = []
      const listener2 = payload => {
        calls2.push(payload)
      }

      const calls3 = []
      const listener3 = payload => {
        calls3.push(payload)
      }

      emitter.on('events', listener1)
      emitter.on('events', listener2)
      emitter.on('events', listener3)
      emitter.on('events', listener1)

      emitter.emit('events', 1)
      emitter.off('events', listener1)
      emitter.emit('events', 2)
      emitter.off('events', listener2)
      emitter.emit('events', 3)
      emitter.off('events', listener2)
      emitter.off('events')
      emitter.emit('events', 4)

      should(calls1).eql([1, 1])
      should(calls2).eql([1, 2])
      should(calls3).eql([1, 2, 3])
    })
  })
})
