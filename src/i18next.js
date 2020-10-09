import baseLogger from './logger.js'
import { getDefaults } from './defaults.js'
import { hookNames } from './hooks.js'
import { isIE10 } from './utils.js'
import EventEmitter from './EventEmitter.js'
import LanguageUtils from './LanguageUtils.js'
import Interpolator from './Interpolator.js'
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
    this.resources = {}
    this.seenNamespaces = []
    this.options = { ...getDefaults(), ...options }
    this.language = this.options.lng
    this.languageUtils = new LanguageUtils(this.options)
    this.interpolator = new Interpolator(this.options.interpolation)
    if (this.language) this.languages = this.languageUtils.toResolveHierarchy(this.language)
    this.services = {
      languageUtils: this.languageUtils,
      interpolator: this.interpolator
    }
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

    this.resources = await internalApi.runLoadResourcesHooks(this)()
    internalApi.cleanResources(this)(this.resources)

    this.addHook('resolvePlural', (count, key, lng, options) => `${key}${this.options.pluralSeparator}${new Intl.PluralRules(lng, { type: options.ordinal ? 'ordinal' : 'cardinal' }).select(count)}`)
    this.addHook('formPlurals', (key, lng, options) => {
      const pr = new Intl.PluralRules(lng, { type: options.ordinal ? 'ordinal' : 'cardinal' })
      return pr.resolvedOptions().pluralCategories.map((form) => `${key}${this.options.pluralSeparator}${form}`)
    })
    this.addHook('resolveContext', (context, key, options) => `${key}${this.options.contextSeparator}${context}`)
    this.addHook('translate', (key, ns, lng, res, options) => res[lng][ns][key])
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
        prev[curr] = this.seenNamespaces
        return prev
      }, {})
      await this.load(toLoad)
    }

    await this.changeLanguage(this.language)

    this.logger.log('initialized', this.options)
    this.emit('initialized', this)

    return this
  }

  async load (toLoad) {
    throwIf.notInitializedFn(this)('load')

    for (const hook of this.readHooks) {
      const ret = hook(toLoad)
      const read = await (ret && ret.then ? ret : Promise.resolve(ret))
      if (!read) continue
      internalApi.cleanResources(this)(read)
      Object.keys(read).forEach((lng) => {
        Object.keys(read[lng]).forEach((ns) => {
          this.resources[lng] = this.resources[lng] || {}
          this.resources[lng][ns] = read[lng][ns]
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
      prev[curr] = this.seenNamespaces
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

    return this.resources[lng]
  }

  isNamespaceLoaded (ns, lng) {
    throwIf.notInitializedFn(this)('isNamespaceLoaded')

    if (!lng) return this.seenNamespaces.indexOf(ns) > -1
    return this.resources[lng] && this.resources[lng][ns]
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

  t (key, options = {}) {
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

    // resolve
    const resolved = internalApi.resolve(this)(key, options)
    let res = resolved && resolved.res
    // const resUsedKey = (resolved && resolved.usedKey) || key
    const resExactUsedKey = (resolved && resolved.exactUsedKey) || key

    // handle missing
    res = internalApi.handleMissing(this)(res, resExactUsedKey, key, ns, lng, options)

    // extend
    res = internalApi.extendTranslation(this)(res, resExactUsedKey, options, resolved)

    return res
  }
}

export default function (options) {
  return new I18next(options)
}
