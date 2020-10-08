import i18next from '../index.js'
import should from 'should'
import { promisify } from 'util'

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
    i18nextInstance.addHook('translate', (key, ns, lng, res) => res[lng][ns][`prefixed.${key}`])
    await i18nextInstance.init()
    const translated = i18nextInstance.t('key', { count: 3 })
    should(translated).eql('some values')
  })

  it('use module', async () => {
    const i18nextInstance = i18next({ lng: 'en' })
    i18nextInstance.use({ // this would be a separate module, like a backend connector...
      register: (i18n) => {
        i18n.addHook('loadResources', () => ({
          en: {
            translation: {
              prefixed: {
                key: 'a value',
                key_plural: 'some values'
              }
            }
          }
        }))
        i18n.addHook('translate', (key, ns, lng, res) => res[lng][ns][`prefixed.${key}`])
      }
    })
    await i18nextInstance.init()
    const translated = i18nextInstance.t('key', { count: 3 })
    should(translated).eql('some values')
  })

  it('read (like backend connector)', async () => {
    const i18nextInstance = i18next({ lng: 'en' })
    i18nextInstance.addHook('read', (toLoad) => {
      const res = {}
      Object.keys(toLoad).forEach((lng) => {
        toLoad[lng].forEach((ns) => {
          res[lng] = res[lng] || {}
          res[lng][ns] = {
            key: `a value for ${lng}/${ns}`
          }
        })
      })
      return res
    })
    await i18nextInstance.init()
    // await i18nextInstance.loadNamespace('translation') // loaded via preload in init
    let translated = i18nextInstance.t('key')
    should(translated).eql('a value for en/translation')
    await i18nextInstance.loadNamespace('translation', 'de')
    translated = i18nextInstance.t('key', { lng: 'de' })
    should(translated).eql('a value for de/translation')
  })

  it('wrap old backend module', async () => {
    class Backend {
      constructor (services, options = {}, allOptions = {}) {
        this.services = services
        this.options = options
        this.allOptions = allOptions
        this.type = 'backend'
        this.init(services, options, allOptions)
      }

      init (services, options = {}, allOptions = {}) {
        this.services = services
        this.options = options
        this.allOptions = allOptions
      }

      read (lng, ns, callback) {
        callback(null, {
          key: `a value for ${lng}/${ns} from old backend`
        })
      }
    }
    const compatibilityLayer = (opt) => ({ // opt are module specific options... not anymore passed as backend options on global i18next options
      register: (i18n) => {
        const oldModule = new Backend(i18n.services, opt)
        i18n.addHook('read', async (toLoad) => {
          const toRead = []
          Object.keys(toLoad).forEach((lng) => {
            toLoad[lng].forEach((ns) => {
              toRead.push({ lng, ns })
            })
          })
          const res = await Promise.all(toRead.map(async (entry) => {
            const ret = await promisify(oldModule.read)(entry.lng, entry.ns)
            return { lng: entry.lng, ns: entry.ns, resources: ret }
          }))
          return res.reduce((prev, curr) => {
            prev[curr.lng] = prev[curr.lng] || {}
            prev[curr.lng][curr.ns] = curr.resources
            return prev
          }, {})
        })
      }
    })

    const i18nextInstance = i18next({ lng: 'en' })
    i18nextInstance.use(compatibilityLayer({ whatever: 'options' }))
    await i18nextInstance.init()
    // await i18nextInstance.loadNamespace('translation') // loaded via preload in init
    let translated = i18nextInstance.t('key')
    should(translated).eql('a value for en/translation from old backend')
    await i18nextInstance.loadNamespace('translation', 'de')
    translated = i18nextInstance.t('key', { lng: 'de' })
    should(translated).eql('a value for de/translation from old backend')
  })

  it('changeLanguage and languageDetector', async () => {
    const cachedLanguages = []
    const i18nextInstance = i18next()
    i18nextInstance
      .addHook('read', (toLoad) => {
        const res = {}
        Object.keys(toLoad).forEach((lng) => {
          toLoad[lng].forEach((ns) => {
            res[lng] = res[lng] || {}
            res[lng][ns] = {
              key: `a value for ${lng}/${ns}`
            }
          })
        })
        return res
      })
      .addHook('detectLanguage', () => ['en'])
      .addHook('cacheLanguage', (lng) => {
        cachedLanguages.push(lng)
      })

    await i18nextInstance.init()
    let translated = i18nextInstance.t('key')
    should(translated).eql('a value for en/translation')
    await i18nextInstance.loadNamespace('ns2')
    translated = i18nextInstance.t('key', { ns: 'ns2' })
    should(translated).eql('a value for en/ns2')
    await i18nextInstance.changeLanguage('de')
    translated = i18nextInstance.t('key')
    should(translated).eql('a value for de/translation')
    translated = i18nextInstance.t('key', { ns: 'ns2' })
    should(translated).eql('a value for de/ns2')
    should(cachedLanguages).eql(['en', 'de'])
  })
})
