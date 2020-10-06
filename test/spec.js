import i18next from '../index.js'
import should from 'should'

describe('i18next', () => {
  it('basic addHook stuff', async () => {
    const i18nextInstance = i18next({ lng: 'en', some: 'options' })
    i18nextInstance.addHook('extendOptions', () => {
      return { add: 'this' }
    })
    i18nextInstance.addHook('extendOptions', () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ another: 'thing' }), 50)
      })
    })
    i18nextInstance.addHook('loadResources', () => ({
      en: {
        translation: {
          'a key': 'a value'
        }
      }
    }))
    await i18nextInstance.init()
    should(i18nextInstance.options).have.properties({
      some: 'options',
      add: 'this',
      another: 'thing',
      pluralOptionProperty: 'count',
      debug: false
    })
    const translated = i18nextInstance.t('a key')
    should(translated).eql('a value')
  })

  it('event emitter', async () => {
    const i18nextInstance = i18next()
    let called = false
    i18nextInstance.on('initialized', (i18n) => {
      should(i18n).eql(i18nextInstance)
      called = true
    })
    await i18nextInstance.init()
    should(called).eql(true)
  })

  it('custom plural resolver', async () => {
    const i18nextInstance = i18next({ lng: 'en' })
    i18nextInstance
      .addHook('loadResources', () => ({
        en: {
          translation: {
            key: 'a value',
            key_3: '3 values',
            '8_key': 'values from other resolver'
          }
        }
      }))
      .addHook('resolvePlural', (count, key, ns, lng) => {
        if (count < 4) return `${key}_${count}`
      })
      .addHook('resolvePlural', (count, key, ns, lng) => `${count * 2}_${key}`)
    await i18nextInstance.init()
    let translated = i18nextInstance.t('key', { count: 3 })
    should(translated).eql('3 values')
    translated = i18nextInstance.t('key', { count: 4 })
    should(translated).eql('values from other resolver')
  })

  it('custom translator', async () => {
    const i18nextInstance = i18next({ lng: 'en' })
    i18nextInstance.addHook('loadResources', () => ({
      en: {
        translation: {
          prefixed: {
            key: 'a value',
            key_plural: 'some values'
          }
        }
      }
    }))
    i18nextInstance.addHook('translate', (key, ns, lng, res) => res[lng][ns].prefixed[key])
    await i18nextInstance.init()
    const translated = i18nextInstance.t('key', { count: 3 })
    should(translated).eql('some values')
  })
})
