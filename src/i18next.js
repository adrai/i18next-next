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
    this.options = { ...getDefaults(), ...options }
    this.language = this.options.lng
    this.store = new ResourceStore({}, this.options)
    this.languageUtils = new LanguageUtils(this.options)
    this.interpolator = new Interpolator(this.options.interpolation)
    if (this.language) this.languages = this.languageUtils.toResolveHierarchy(this.language)
    this.services = {
      resourceStore: this.store,
      languageUtils: this.languageUtils,
      interpolator: this.interpolator
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

    await internalApi.runExtendOptionsHooks(this)()
    this.language = this.options.lng

    baseLogger.init(this.services.logger, this.options)
    this.logger = baseLogger
    this.services.logger = this.logger

    const resources = await internalApi.runLoadResourcesHooks(this)()
    this.store.setData(resources)

    this.addHook('resolvePlural', (count, key, lng, options) => `${key}${this.options.pluralSeparator}${new Intl.PluralRules(lng, { type: options.ordinal ? 'ordinal' : 'cardinal' }).select(count)}`)
    this.addHook('formPlurals', (key, lng, options) => {
      const pr = new Intl.PluralRules(lng, { type: options.ordinal ? 'ordinal' : 'cardinal' })
      return pr.resolvedOptions().pluralCategories.map((form) => `${key}${this.options.pluralSeparator}${form}`)
    })
    this.addHook('resolveContext', (context, key, options) => `${key}${this.options.contextSeparator}${context}`)
    this.addHook('translate', (key, ns, lng, res, options) => deepFind(res[lng][ns], key))
    this.addHook('bestMatchFromCodes', (lngs) => this.languageUtils.getBestMatchFromCodes(lngs))
    this.addHook('fallbackCodes', (fallbackLng, lng) => this.languageUtils.getFallbackCodes(fallbackLng, lng))
    this.addHook('resolveHierarchy', (lng, fallbackLng) => this.languageUtils.toResolveHierarchy(lng, fallbackLng))
    this.addHook('interpolate', (value, data, options) => this.interpolator.interpolate(value, data, options))

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
      await this.load(toLoad)
    }

    await this.changeLanguage(this.language)

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
      const read = await (ret && ret.then ? ret : Promise.resolve(ret))
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

    this.emit('languageChanging', lng)

    await this.loadLanguage(lng)
    this.language = lng
    this.languages = internalApi.runResolveHierarchyHooks(this)(this.language)
    await internalApi.runCacheLanguageHooks(this)(this.language)

    this.emit('languageChanged', lng)
    this.logger.log('languageChanged', lng)
  }

  exists (key, options = {}) {
    const resolved = internalApi.resolve(this)(key, options)
    return resolved && resolved.res !== undefined
  }

  t (keys, options = {}) {
    throwIf.notInitializedFn(this)('t')

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

    // non valid keys handling
    if (keys === undefined || keys === null) return ''
    if (!Array.isArray(keys)) keys = [String(keys)]

    // get namespace(s)
    const { key, namespaces } = internalApi.extractFromKey(this)(keys[keys.length - 1], options)
    const namespace = namespaces[namespaces.length - 1]

    // return key on CIMode
    const appendNamespaceToCIMode = options.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode
    if (lng && lng.toLowerCase() === 'cimode') {
      const nsSeparator = options.nsSeparator || this.options.nsSeparator
      if (appendNamespaceToCIMode && nsSeparator) {
        return namespace + nsSeparator + key
      }
      return key
    }

    // resolve
    const resolved = internalApi.resolve(this)(keys, options)
    let res = resolved && resolved.res
    const resUsedKey = (resolved && resolved.usedKey) || key
    const resExactUsedKey = (resolved && resolved.exactUsedKey) || key

    if (res !== undefined) {
      const handleAsObject = typeof res !== 'string' && typeof res !== 'boolean' && typeof res !== 'number'
      const keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator
      if (handleAsObject && keySeparator) {
        const resType = Object.prototype.toString.apply(res)
        const resTypeIsArray = resType === '[object Array]'
        const copy = resTypeIsArray ? [] : {} // apply child translation on a copy
        const newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey
        for (const m in res) {
          if (Object.prototype.hasOwnProperty.call(res, m)) {
            const deepKey = `${newKeyToUse}${keySeparator}${m}`
            copy[m] = this.t(deepKey, {
              ...options,
              ...{ joinArrays: false, ns }
            })
            if (copy[m] === deepKey) copy[m] = res[m] // if nothing found use orginal value as fallback
          }
        }
        res = copy
      }
    }

    // handle missing
    res = internalApi.handleMissing(this)(res, resExactUsedKey, key, ns, lng, options)

    // extend
    res = internalApi.extendTranslation(this)(res, keys, options, resolved)

    return res
  }
}

export default function (options) {
  return new I18next(options)
}
