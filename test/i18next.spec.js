import i18next from '../index.js'
import should from 'should'

describe('i18next', () => {
  let i18n
  before(async () => {
    i18n = i18next({
      foo: 'bar',
      debug: false
    })
    await i18n.init()
    await i18n.changeLanguage('en')
  })

  describe('instance creation', () => {
    describe('createInstance()', () => {
      let newInstance
      before(() => {
        newInstance = i18next({ bar: 'foo' })
      })

      it('should not inherit options from inital i18next', () => {
        should(newInstance.options.foo).eql(undefined)
        should(newInstance.options.bar).eql('foo')
      })

      it('has own instance of resource store', () => {
        should(newInstance.store).not.eql(i18n.store)
      })
    })

    describe('clone()', () => {
      let newInstance
      before(async () => {
        newInstance = await i18n.clone({ bar: 'foo' })
      })

      it('should inherit options from inital i18next', () => {
        should(newInstance.options.foo).eql('bar')
        should(newInstance.options.bar).eql('foo')
      })

      it('has shared instance of resource store', () => {
        should(newInstance.store).eql(i18n.store)
      })

      it('is set to same language', () => {
        should(newInstance.language).eql(i18n.language)
      })

      it('can change language independent to original', async () => {
        await newInstance.changeLanguage('de')
        should(newInstance.language).eql('de')
        should(i18n.language).eql('en')
      })
    })

    describe('create/clone()', () => {
      let instance1
      let instance2
      before(async () => {
        instance1 = await i18n.clone({ lng: 'en' })
        instance2 = await instance1.clone({ lng: 'de' })
      })

      it('should have correct lngs', () => {
        should(instance1.language).eql('en')
        should(instance1.languages).eql(['en', 'dev'])
        should(instance2.language).eql('de')
        should(instance2.languages).eql(['de', 'dev'])
      })
    })
  })

  describe('i18next - functions', () => {
    describe('getFixedT', () => {
      it('should have lng, ns on t', () => {
        const t = i18n.getFixedT('de', 'common')
        should(t.lng).eql('de')
        should(t.ns).eql('common')
      })
      it('should handle default value', () => {
        const t = i18n.getFixedT(null, null)
        const translatedKey = t('key', 'default')
        const translatedSecondKey = t('key', { defaultValue: 'default' })
        should(translatedKey).eql('default')
        should(translatedSecondKey).eql('default')
      })
    })
  })

  describe('chained resource manipulation', () => {
    describe('can add resources', () => {
      it('adds resouces by addResource', () => {
        i18n
          .addResource('de', 'translation', 'test', 'test')
          .addResource('de', 'translation', 'nest.test', 'test_nest')
        should(i18n.getResource('de', 'translation', 'test')).eql('test')
        should(i18n.getResource('de', 'translation', 'nest.test')).eql('test_nest')
      })

      it('adds resouces by addResources', () => {
        i18n
          .addResources('fr', 'translation', {
            hi: 'salut'
          })
          .addResources('fr', 'translation', {
            hi: 'salut',
            hello: 'bonjour'
          })
        should(i18n.getResource('fr', 'translation', 'hi')).eql('salut')
        should(i18n.getResource('fr', 'translation', 'hello')).eql('bonjour')
      })

      it('adds resouces by addResourceBundle', () => {
        i18n
          .addResourceBundle('en.translation', { something1: 'deeper1' })
          .addResourceBundle('en.translation', { something2: 'deeper2' })
        should(i18n.getResource('en.translation')).eql({
          something1: 'deeper1',
          something2: 'deeper2'
        })
      })

      describe('can remove resources bundle', () => {
        it('removes resouces by removeResourceBundle', () => {
          i18n.removeResourceBundle('en', 'translation')
          should(i18n.getResourceBundle('en', 'translation')).eql(undefined)
        })
      })
    })
  })
})
