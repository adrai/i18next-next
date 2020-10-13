import should from 'should'
import sinon from 'sinon'
import ResourceStore from '../src/ResourceStore.js'

describe('ResourceStore', () => {
  describe('constructor', () => {
    it('should set empty data if not passing them in', () => {
      const rs = new ResourceStore()
      should(rs.toJSON()).eql({})
    })

    it('should set data if passing them in', () => {
      const data = {
        en: {
          translation: {
            test: 'test'
          }
        }
      }
      const rs = new ResourceStore(data)
      should(rs.toJSON()).eql(data)
    })
  })

  describe('resource manipulation', () => {
    let rs

    describe('can add resources', () => {
      beforeEach(() => {
        const data = { en: { translation: { test: 'test' } } }
        rs = new ResourceStore(data)
      })

      it('adds resouces by addResource', () => {
        // basic key
        rs.addResource('de', 'translation', 'test', 'test')
        should(rs.getResource('de', 'translation', 'test')).eql('test')

        // dotted key
        rs.addResource('de', 'translation', 'nest.test', 'test_nest')
        should(rs.getResource('de', 'translation', 'nest.test')).eql('test_nest')

        // using first param fullDot
        rs.addResource('de.translation.nest.fullDot', 'test_fullDot')
        should(rs.getResource('de.translation.nest.fullDot')).eql('test_fullDot')

        // setting object
        rs.addResource('de.translation.nest.object', { something: 'deeper' })
        should(rs.getResource('de.translation.nest.object.something')).eql('deeper')

        // getting object
        should(rs.getResource('de.translation.nest.object')).eql({ something: 'deeper' })
      })

      it("it should emit 'added' event on addResource call", () => {
        const spy = sinon.spy()
        rs.on('added', spy)
        rs.addResource('fr', 'translation', 'hi', 'salut')
        should(spy.calledWithExactly('fr', 'translation', 'hi', 'salut')).be.true()
      })

      it("it should not emit 'added' event on addResource call with silent option", () => {
        const spy = sinon.spy()
        rs.on('added', spy)
        rs.addResource('fr', 'translation', 'hi', 'salut', { silent: true })
        should(spy.notCalled).be.true()
      })

      it("it should emit 'added' event on addResources call", () => {
        const spy = sinon.spy()
        rs.on('added', spy)
        rs.addResources('fr', 'translation', {
          hi: 'salut',
          hello: 'bonjour'
        })
        should(spy.calledOnce).be.true()
      })

      it("it should not emit 'added' event on addResources call with silent option", () => {
        const spy = sinon.spy()
        rs.on('added', spy)
        rs.addResources(
          'fr',
          'translation',
          {
            hi: 'salut',
            hello: 'bonjour'
          },
          { silent: true }
        )
        should(spy.notCalled).be.true()
      })

      it("it should emit 'added' event on addResourceBundle call", () => {
        const spy = sinon.spy()
        rs.on('added', spy)
        rs.addResourceBundle(
          'fr',
          'translation',
          {
            hi: 'salut',
            hello: 'bonjour'
          },
          true,
          true
        )
        should(spy.calledOnce).be.true()
      })

      it("it should not emit 'added' event on addResourceBundle call with silent option", () => {
        const spy = sinon.spy()
        rs.on('added', spy)
        rs.addResourceBundle(
          'fr',
          'translation',
          {
            hi: 'salut',
            hello: 'bonjour'
          },
          true,
          true,
          { silent: true }
        )
        should(spy.notCalled).be.true()
      })
    })

    describe('can extend resources bundle', () => {
      beforeEach(() => {
        const data = { en: { translation: { test: 'test' } } }
        rs = new ResourceStore(data)
      })

      it('adds resouces by addResourceBundle', () => {
        rs.addResourceBundle('en', 'translation', { something: 'deeper' })
        should(rs.getResource('en', 'translation')).eql({ something: 'deeper', test: 'test' })

        // dotty
        rs.addResourceBundle('en.translation', { something1: 'deeper1' })
        should(rs.getResource('en.translation')).eql({
          something: 'deeper',
          something1: 'deeper1',
          test: 'test'
        })
      })

      it('without polluting the prototype', () => {
        const malicious = '{"__proto__":{"vulnerable":"Polluted"}}'
        rs.addResourceBundle('en', 'translation', JSON.parse(malicious), true, true)
        should({}.vulnerable).eql(undefined)
      })
    })

    describe('can check resources bundle', () => {
      beforeEach(() => {
        const data = { en: { translation: { test: 'test' } } }
        rs = new ResourceStore(data)
      })

      it('checks resouces by hasResourceBundle', () => {
        should(rs.hasResourceBundle('en', 'translation')).be.true()
        should(rs.hasResourceBundle('en', 'notExisting')).not.be.true()
      })
    })

    describe('can get resources bundle', () => {
      beforeEach(() => {
        const data = { en: { translation: { test: 'test' } } }
        rs = new ResourceStore(data)
      })

      it('get resouces by getResourceBundle', () => {
        should(rs.getResourceBundle('en', 'translation')).eql({ test: 'test' })
      })
    })

    describe('can remove resources bundle', () => {
      beforeEach(() => {
        const data = { en: { translation: { test: 'test' } } }
        rs = new ResourceStore(data)
      })

      it('removes resouces by removeResourceBundle', () => {
        rs.removeResourceBundle('en', 'translation')
        should(rs.getResourceBundle('en', 'translation')).not.be.true()
      })
    })

    describe('can get data by language', () => {
      beforeEach(() => {
        const data = { en: { translation: { test: 'test' } } }
        rs = new ResourceStore(data)
      })

      it('gets data by getDataByLanguage', () => {
        should(rs.getDataByLanguage('en')).eql({ translation: { test: 'test' } })
      })
    })
  })
})
