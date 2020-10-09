import i18next from '../index.js'
import should from 'should'
import { compatibilityLayer } from './helpers/compatibilityLayer.js'
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
      .addHook('resolvePlural', (count, key, lng) => {
        if (count < 4) return `${key}_${count}`
      })
      .addHook('resolvePlural', (count, key, lng) => `${count * 2}_${key}`)
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
            key_other: 'other values'
          }
        }
      }
    }))
    i18nextInstance.addHook('translate', (key, ns, lng, res) => res[lng][ns][`prefixed.${key}`])
    await i18nextInstance.init()
    const translated = i18nextInstance.t('key', { count: 3 })
    should(translated).eql('other values')
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
                key_other: 'other values'
              }
            }
          }
        }))
        i18n.addHook('translate', (key, ns, lng, res) => res[lng][ns][`prefixed.${key}`])
      }
    })
    await i18nextInstance.init()
    const translated = i18nextInstance.t('key', { count: 3 })
    should(translated).eql('other values')
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
    const i18nextInstance = i18next({ lng: 'en' })
    i18nextInstance.use(compatibilityLayer(Backend, { onlyBackend: 'options' }))
    await i18nextInstance.init()
    let translated = i18nextInstance.t('key')
    should(translated).eql('a value for en/translation from old backend')
    await i18nextInstance.loadNamespace('translation', 'de')
    translated = i18nextInstance.t('key', { lng: 'de' })
    should(translated).eql('a value for de/translation from old backend')
  })

  it('changeLanguage and languageDetector', async () => {
    const cachedLanguages = []
    class LanguageDetector {
      constructor (services, options = {}, allOptions = {}) {
        this.services = services
        this.options = options
        this.allOptions = allOptions
        this.type = 'languageDetector'
        this.init(services, options, allOptions)
      }

      init (services, options = {}, allOptions = {}) {
        this.services = services
        this.options = options
        this.allOptions = allOptions
      }

      detect () {
        return ['en']
      }

      cacheUserLanguage (lng) {
        cachedLanguages.push(lng)
      }
    }
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
      .use(compatibilityLayer(LanguageDetector))

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

  it('post process', async () => {
    const postProcessor = {
      type: 'postProcessor',
      name: 'my-post-processor',
      intervalMatches (interval, count) {
        if (interval.indexOf('-') > -1) {
          const p = interval.split('-')
          if (p[1] === 'inf') {
            const from = parseInt(p[0], 10)
            return count >= from
          } else {
            const from = parseInt(p[0], 10)
            const to = parseInt(p[1], 10)
            return count >= from && count <= to
          }
        } else {
          const match = parseInt(interval, 10)
          return match === count
        }
      },
      process (value, key, opt) {
        const p = value.split(';')
        let found
        p.forEach((iv) => {
          if (found) return
          const match = /\((\S*)\).*{((.|\n)*)}/.exec(iv)

          if (match && this.intervalMatches(match[1], opt[i18nextInstance.options.pluralOptionProperty] || 0)) {
            found = match[2]
          }
        })
        return found || value
      }
    }
    const i18nextInstance = i18next({ lng: 'en' })
    i18nextInstance.addHook('read', (toLoad) => {
      const res = {}
      Object.keys(toLoad).forEach((lng) => {
        toLoad[lng].forEach((ns) => {
          res[lng] = res[lng] || {}
          res[lng][ns] = {
            key: '(1){one item};(2-7){a few items};(7-inf){a lot of items};'
          }
        })
      })
      return res
    })
    i18nextInstance.use(compatibilityLayer(postProcessor))
    await i18nextInstance.init()
    const translated = i18nextInstance.t('key', { postProcess: 'my-post-processor', count: 2 })
    should(translated).eql('a few items')
  })

  it('fallback language', async () => {
    const i18nextInstance = i18next({ lng: 'en' })
    i18nextInstance.addHook('loadResources', () => ({
      en: {
        translation: {
          key: 'a value for en/translation'
        }
      },
      'en-GB': {
        translation: {
          other: 'thing'
        }
      }
    }))
    await i18nextInstance.init()
    let translated = i18nextInstance.t('key')
    should(translated).eql('a value for en/translation')
    translated = i18nextInstance.t('key', { lng: 'en-GB' })
    should(translated).eql('a value for en/translation')
  })

  it('save missing', async () => {
    const i18nextInstance = i18next({ lng: 'en', saveMissing: true })
    i18nextInstance.addHook('loadResources', () => ({
      en: {
        translation: {
          key: 'a value for en/translation'
        }
      },
      de: {
        translation: {
          other: 'stuff'
        }
      }
    }))

    const missings = []
    i18nextInstance.addHook('handleMissingKey', (key, ns, lng, value, options) => {
      missings.push({ key, ns, lng, value, options })
    })
    await i18nextInstance.init()
    let translated = i18nextInstance.t('key')
    should(translated).eql('a value for en/translation')
    translated = i18nextInstance.t('key', { lng: 'de', defaultValue: 'a value for de/translation' })
    should(translated).eql('a value for de/translation')
    await wait(20)
    should(missings).have.a.lengthOf(1)
    should(missings[0].key).eql('key')
    should(missings[0].ns).eql('translation')
    should(missings[0].lng).eql(['de'])
    should(missings[0].value).eql('a value for de/translation')
  })

  it('custom interpolation', async () => {
    const i18nextInstance = i18next({ lng: 'en' })
    i18nextInstance.addHook('loadResources', () => ({
      en: {
        translation: {
          key: 'a value for en/translation with _something_',
          keyDefault: 'a value for en/translation with {{something}}'
        }
      }
    }))
    i18nextInstance.addHook('interpolate', (str, data, options) => {
      const regexp = new RegExp('_(.+?)_', 'g')
      let match, value
      while ((match = regexp.exec(str))) {
        value = match[1].trim()
        str = str.replace(match[0], data[value])
        regexp.lastIndex = 0
      }
      return str
    })
    await i18nextInstance.init()
    let translated = i18nextInstance.t('key', { something: 'magic' })
    should(translated).eql('a value for en/translation with magic')
    translated = i18nextInstance.t('keyDefault', { something: 'wonder' })
    should(translated).eql('a value for en/translation with wonder')
  })

  it('default interpolation', async () => {
    const i18nextInstance = i18next({ lng: 'en' })
    i18nextInstance.addHook('loadResources', () => ({
      en: {
        translation: {
          key: 'a value for en/translation with {{something}}',
          key2: 'a value for en/translation with {{obj.something}}'
        }
      }
    }))
    await i18nextInstance.init()
    let translated = i18nextInstance.t('key', { something: 'magic' })
    should(translated).eql('a value for en/translation with magic')
    translated = i18nextInstance.t('key2', { obj: { something: 'cool' } })
    should(translated).eql('a value for en/translation with cool')
    translated = i18nextInstance.t('key', { something: '<img />' })
    should(translated).eql('a value for en/translation with &lt;img &#x2F;&gt;')
    translated = i18nextInstance.t('key', { something: '<img />', interpolation: { escapeValue: false } })
    should(translated).eql('a value for en/translation with <img />')
  })
})
