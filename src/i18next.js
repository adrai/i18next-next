import baseLogger from './logger.js'
import { getDefaults } from './defaults.js'
import { hookNames } from './hooks.js'
import { isIE10, deepFind } from './utils.js'
import EventEmitter from './EventEmitter.js'
import LanguageUtils from './LanguageUtils.js'
import Interpolator from './Interpolator.js'
import ResourceStore from './ResourceStore.js'
import throwIf from './throwIf.js'
import internalApi from './internal.js'

class I18next extends EventEmitter {
  constructor (options = {}) {
    super()
    if (isIE10) EventEmitter.call(this) // <=IE10 fix (unable to call parent constructor)
    this.isInitialized = false
    hookNames.forEach((name) => {
      if (name === 'postProcess') {
        this[`${name}Hooks`] = {}
        return
      }
      this[`${name}Hooks`] = []
    })
    const defOpt = getDefaults()
    this.options = { ...defOpt, ...options }
    if (options.interpolation) this.options = { ...this.options, interpolation: { ...defOpt.interpolation, ...options.interpolation } }
    this.language = this.options.lng
    this.store = new ResourceStore({}, this.options)
    this.languageUtils = new LanguageUtils(this.options)
    this.interpolator = new Interpolator(this.options.interpolation)
    if (this.language) this.languages = this.languageUtils.toResolveHierarchy(this.language)
    this.services = {
      resourceStore: this.store,
      languageUtils: this.languageUtils,
      interpolator: this.interpolator,
      utils: {
        isNamespaceLoaded: this.isNamespaceLoaded.bind(this)
      }
    }

    // append api
    const storeApi = [
      'getResource',
      'hasResourceBundle',
      'getResourceBundle',
      'getDataByLanguage'
    ]
    storeApi.forEach(fcName => {
      this[fcName] = (...args) => this.store[fcName](...args)
    })
    const storeApiChained = [
      'addResource',
      'addResources',
      'addResourceBundle',
      'removeResourceBundle'
    ]
    storeApiChained.forEach(fcName => {
      this[fcName] = (...args) => {
        this.store[fcName](...args)
        return this
      }
    })
  }

  /**
   * public api
   */

  use (module) {
    if (!module) throw new Error('You are passing an undefined module! Please check the object you are passing to i18next.use()')
    if (!module.register && module.log && module.warn && module.error) {
      this.services.logger = this.logger
      return this
    }
    if (module.type) throw new Error('You are probably passing an old module! Please check the object you are passing to i18next.use()')
    if (typeof module.register !== 'function') throw new Error('You are passing a wrong module! Please check the object you are passing to i18next.use()')

    module.register(this)
    return this
  }

  addHook (name, type, hook) {
    if (!hook) {
      hook = type
      type = undefined
    }
    if (hookNames.indexOf(name) < 0) throw new Error(`${name} is not a valid hook!`)
    throwIf.alreadyInitializedFn(this)(`addHook(${name})`)

    if (type) {
      this[`${name}Hooks`][type] = hook
    } else {
      this[`${name}Hooks`].push(hook)
    }
    return this
  }

  async init () {
    throwIf.alreadyInitializedFn('Already initialized!')

    if (this.options.initImmediate === false) internalApi.runExtendOptionsHooks(this)()
    else await internalApi.runExtendOptionsHooks(this)()
    this.language = this.options.lng

    baseLogger.init(this.services.logger, this.options)
    this.logger = baseLogger
    this.services.logger = this.logger

    if (this.options.initImmediate === false) {
      const allResources = this.loadResourcesHooks.map((hook) => hook(this.options))
      const foundIndex = allResources.findIndex((r) => r && typeof r.then === 'function')
      if (foundIndex > -1) {
        const msg = `You set initImmediate to false but are using an asynchronous loadResources hook (${foundIndex + 1}. hook)`
        this.logger.error(msg, this.loadResourcesHooks[foundIndex].toString())
        throw new Error(msg)
      }
      const resources = allResources.reduce((prev, curr) => ({ ...prev, ...curr }), {})
      this.store.setData(resources)
      this.logger.log('set data', resources)
    } else {
      const resources = await internalApi.runLoadResourcesHooks(this)()
      this.store.setData(resources)
      this.logger.log('set data', resources)
    }

    this.addHook('translate', (key, ns, lng, options) => internalApi.translate(this)(key, ns, lng, options))
    this.addHook('resolvePlural', (count, key, lng, options) => `${key}${this.options.pluralSeparator}${new Intl.PluralRules(lng, { type: options.ordinal ? 'ordinal' : 'cardinal' }).select(count)}`)
    this.addHook('formPlurals', (key, lng, options) => {
      const pr = new Intl.PluralRules(lng, { type: options.ordinal ? 'ordinal' : 'cardinal' })
      return pr.resolvedOptions().pluralCategories.map((form) => `${key}${this.options.pluralSeparator}${form}`)
    })
    this.addHook('resolveContext', (context, key, options) => `${key}${this.options.contextSeparator}${context}`)
    this.addHook('resolveKey', (key, ns, lng, res, options) => deepFind(res[lng][ns], key))
    this.addHook('bestMatchFromCodes', (lngs) => this.languageUtils.getBestMatchFromCodes(lngs))
    this.addHook('fallbackCodes', (fallbackLng, lng) => this.languageUtils.getFallbackCodes(fallbackLng, lng))
    this.addHook('resolveHierarchy', (lng, fallbackLng) => this.languageUtils.toResolveHierarchy(lng, fallbackLng))
    this.addHook('interpolate', (value, data, lng, options) => this.interpolator.interpolate(value, data, lng, options))

    this.services.languageUtils = {
      ...this.services.languageUtils,
      getBestMatchFromCodes: internalApi.runBestMatchFromCodesHooks(this),
      getFallbackCodes: internalApi.runFallbackCodesHooks(this),
      toResolveHierarchy: internalApi.runResolveHierarchyHooks(this)
    }

    this.services.interpolator = {
      ...this.services.interpolator,
      interpolate: internalApi.runInterpolateHooks(this)
    }

    if (this.language) this.languages = internalApi.runResolveHierarchyHooks(this)(this.language)

    if (this.language && this.options.preload.indexOf(this.language) < 0) this.options.preload.unshift(this.language)

    this.isInitialized = true
    if (this.options.preload.length > 0) {
      const toLoad = this.options.preload.reduce((prev, curr) => {
        prev[curr] = this.store.getSeenNamespaces()
        return prev
      }, {})

      if (this.options.initImmediate === false) {
        for (const hook of this.readHooks) {
          const read = hook(toLoad)
          if (read && typeof read.then === 'function') {
            const msg = `You set initImmediate to false but are using an asynchronous read hook (${this.readHooks.indexOf(hook) + 1}. hook)`
            this.logger.error(msg, hook.toString())
            throw new Error(msg)
          }
          if (!read) continue
          Object.keys(read).forEach((lng) => {
            Object.keys(read[lng]).forEach((ns) => {
              this.store.addResourceBundle(lng, ns, read[lng][ns])
              this.logger.log(`loaded namespace ${ns} for language ${lng}`, read[lng][ns])
            })
          })
          this.emit('loaded', toLoad)
        }
      } else {
        await this.load(toLoad)
      }
    }

    if (this.options.initImmediate === false) this.changeLanguage(this.language)
    else await this.changeLanguage(this.language)

    this.logger.log('initialized', this.options)
    this.emit('initialized', this)

    if (!this.language && this.detectLanguageHooks.length === 0) {
      this.logger.warn('init: no lng is defined and no languageDetector is used')
    }

    return this
  }

  async load (toLoad) {
    throwIf.notInitializedFn(this)('load')

    for (const hook of this.readHooks) {
      const ret = hook(toLoad)
      const read = await (ret && typeof ret.then === 'function' ? ret : Promise.resolve(ret))
      if (!read) continue
      Object.keys(read).forEach((lng) => {
        Object.keys(read[lng]).forEach((ns) => {
          this.store.addResourceBundle(lng, ns, read[lng][ns])
          this.logger.log(`loaded namespace ${ns} for language ${lng}`, read[lng][ns])
        })
      })
      this.emit('loaded', toLoad)
      return
    }
  }

  async loadLanguages (lngs) {
    throwIf.notInitializedFn(this)('loadLanguages')

    if (typeof lngs === 'string') lngs = [lngs]
    const newLngs = lngs.filter((lng) => this.options.preload.indexOf(lng) < 0)
    // Exit early if all given languages are already preloaded
    if (!newLngs.length) return

    this.options.preload = this.options.preload.concat(newLngs)

    const toLoad = newLngs.reduce((prev, curr) => {
      prev[curr] = this.store.getSeenNamespaces()
      return prev
    }, {})
    return this.load(toLoad)
  }

  async loadLanguage (lng) {
    return this.loadLanguages(lng)
  }

  async loadNamespaces (ns, lng) {
    throwIf.notInitializedFn(this)('loadNamespace')
    if (typeof ns === 'string') ns = [ns]

    if (!lng) lng = this.language
    if (lng) {
      const toLoad = {
        [lng]: ns
      }
      const lngs = internalApi.runResolveHierarchyHooks(this)(lng)
      lngs.forEach(l => {
        if (!toLoad[l]) toLoad[l] = ns
      })
      return this.load(toLoad)
    }

    // at least load fallbacks in this case
    const fallbacks = internalApi.runFallbackCodesHooks(this)(this.options.fallbackLng)
    if (fallbacks.length === 0) throw new Error('There is no language defined!')
    return fallbacks.reduce((prev, curr) => {
      prev[curr] = ns
      return prev
    }, {})
  }

  async loadNamespace (ns, lng) {
    return this.loadNamespaces(ns, lng)
  }

  isLanguageLoaded (lng) {
    throwIf.notInitializedFn(this)('isLanguageLoaded')

    return this.store.hasResourceBundle(lng)
  }

  isNamespaceLoaded (ns, lng) {
    throwIf.notInitializedFn(this)('isNamespaceLoaded')

    return this.store.hasResourceBundle(lng, ns)
  }

  dir (lng) {
    if (!lng) lng = this.language
    return this.languageUtils.dir(lng)
  }

  async changeLanguage (lng) {
    throwIf.notInitializedFn(this)('changeLanguage')

    if (!lng) lng = await internalApi.runDetectLanguageHooks(this)()

    lng = typeof lng === 'string' ? lng : internalApi.runBestMatchFromCodesHooks(this)(lng)
    if (!lng) return
    if (lng === this.language) return

    this.emit('languageChanging', lng)

    await this.loadLanguage(lng)
    this.language = lng
    this.languages = internalApi.runResolveHierarchyHooks(this)(this.language)
    await internalApi.runCacheLanguageHooks(this)(this.language)

    this.emit('languageChanged', lng)
    this.logger.log('languageChanged', lng)
  }

  setDefaultNamespace (ns) {
    this.options.defaultNS = ns
  }

  exists (key, options = {}) {
    const resolved = internalApi.resolve(this)(key, options)
    return resolved && resolved.res !== undefined
  }

  getFixedT (lng, ns) {
    const fixedT = (key, opts, ...rest) => {
      const options = { ...opts }
      // let options
      // if (typeof opts !== 'object') {
      //   options = this.options.overloadTranslationOptionHandler([key, opts].concat(rest))
      // } else {
      //   options = { ...opts }
      // }

      options.lng = options.lng || fixedT.lng
      options.lngs = options.lngs || fixedT.lngs
      options.ns = options.ns || fixedT.ns
      return this.t(key, options)
    }
    if (typeof lng === 'string') {
      fixedT.lng = lng
    } else {
      fixedT.lngs = lng
    }
    fixedT.ns = ns
    return fixedT
  }

  t (key, options = {}) {
    throwIf.notInitializedFn(this)('t')

    // if (this.options.overloadTranslationOptionHandler) {
    //   options = { ...options, ...this.options.overloadTranslationOptionHandler(arguments) }
    // }

    const lng = options.lng = options.lng || this.language
    if (!lng) throw new Error('There is no language defined!')

    const ns = options.ns = options.ns || this.options.defaultNS

    if (!this.isLanguageLoaded(lng)) {
      this.logger.warn(`Language ${lng} not loaded!`)
      return undefined
    }
    if (!this.isNamespaceLoaded(ns, lng)) {
      this.logger.warn(`Namespace ${ns} for language ${lng} not loaded!`)
      return undefined
    }

    return internalApi.runTranslateHooks(this)(key, ns, lng, options)
  }

  async cloneInstance (options = {}) {
    const mergedOptions = { ...this.options, ...options, ...{ isClone: true } }
    const clone = new I18next(mergedOptions)
    const membersToCopy = ['store', 'services', 'language']
    membersToCopy.forEach((m) => {
      clone[m] = this[m]
    })
    clone.services = { ...this.services }
    clone.services.utils = {
      isNamespaceLoaded: clone.isNamespaceLoaded.bind(clone)
    }
    await clone.init()
    return clone
  }
}

export default function (options) {
  return new I18next(options)
}
