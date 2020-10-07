import baseLogger from './logger.js'
import { getDefaults } from './defaults.js'
import { hookNames, runHooks } from './hooks.js'
import { isIE10 } from './utils.js'
import EventEmitter from './EventEmitter.js'
import LanguageUtils from './LanguageUtils.js'

class I18next extends EventEmitter {
  constructor (options = {}) {
    super()
    if (isIE10) EventEmitter.call(this) // <=IE10 fix (unable to call parent constructor)
    this.logger = baseLogger
    this.isInitialized = false
    hookNames.forEach((name) => {
      this[`${name}Hooks`] = []
    })
    this.resources = {}
    this.options = { ...getDefaults(), ...options }
    this.language = this.options.lng
    this.services = {
      logger: baseLogger,
      languageUtils: new LanguageUtils(this.options)
    }
  }

  throwIfAlreadyInitialized (msg) {
    if (this.isInitialized) throw new Error(msg)
  }

  throwIfAlreadyInitializedFn (fn) {
    this.throwIfAlreadyInitialized(`Cannot call "${fn}" function when i18next instance is already initialized!`)
  }

  throwIfNotInitialized (msg) {
    if (!this.isInitialized) throw new Error(msg)
  }

  throwIfNotInitializedFn (fn) {
    this.throwIfNotInitialized(`Cannot call "${fn}" function when i18next instance is not yet initialized!`)
  }

  async runExtendOptionsHooks () {
    const allOptions = await runHooks(this.extendOptionsHooks, [{ ...this.options }])
    allOptions.forEach((opt) => {
      this.options = { ...opt, ...this.options }
    })
  }

  async runLoadResourcesHooks () {
    const allResources = await runHooks(this.loadResourcesHooks, [this.options])
    return allResources.reduce((prev, curr) => ({ ...prev, ...curr }), {})
  }

  async runDetectLanguageHooks () {
    for (const hook of this.detectLanguageHooks) {
      const ret = hook()
      let lngs = await (ret && ret.then ? ret : Promise.resolve(ret))
      if (lngs && typeof lngs === 'string') lngs = [lngs]
      if (lngs) return lngs
    }
  }

  async runCacheLanguageHooks (lng) {
    return runHooks(this.cacheLanguageHooks, [lng])
  }

  runResolvePluralHooks (count, key, ns, lng, options) {
    for (const hook of this.resolvePluralHooks) {
      const resolvedKey = hook(count, key, ns, lng, options)
      if (resolvedKey !== undefined) return resolvedKey
    }
  }

  runTranslateHooks (key, ns, lng, options) {
    for (const hook of this.translateHooks) {
      const resolvedValue = hook(key, ns, lng, this.resources, options)
      if (resolvedValue !== undefined) return resolvedValue
    }
  }

  runBestMatchFromCodesHooks (lngs) {
    for (const hook of this.bestMatchFromCodesHooks) {
      const lng = hook(lngs)
      if (lng !== undefined) return lng
    }
  }

  calculateSeenNamespaces () {
    const namespaces = []
    Object.keys(this.resources).forEach((lng) => {
      Object.keys(this.resources[lng]).forEach((ns) => {
        if (namespaces.indexOf(ns) < 0) namespaces.push(ns)
      })
    })
    if (namespaces.indexOf(this.options.defaultNS) < 0) namespaces.push(this.options.defaultNS)
    this.seenNamespaces = namespaces
  }

  /**
   * public api
   */

  use (module) {
    if (!module) throw new Error('You are passing an undefined module! Please check the object you are passing to i18next.use()')
    if (module.type) throw new Error('You are probably passing an old module! Please check the object you are passing to i18next.use()')
    if (typeof module.register !== 'function') throw new Error('You are passing a wrong module! Please check the object you are passing to i18next.use()')

    module.register(this)
    return this
  }

  addHook (name, hook) {
    if (hookNames.indexOf(name) < 0) throw new Error(`${name} is not a valid hook!`)
    this.throwIfAlreadyInitializedFn(`addHook(${name})`)

    this[`${name}Hooks`].push(hook)
    return this
  }

  async init () {
    this.throwIfAlreadyInitialized('Already initialized!')

    await this.runExtendOptionsHooks()
    this.language = this.options.lng

    this.resources = await this.runLoadResourcesHooks()
    this.calculateSeenNamespaces()

    this.addHook('resolvePlural', (count, key, ns, lng, options) => `${key}_plural`)
    this.addHook('translate', (key, ns, lng, res, options) => res[lng][ns][key])
    this.addHook('bestMatchFromCodes', (lngs) => this.services.languageUtils.getBestMatchFromCodes(lngs))

    if (this.language && this.options.preload.indexOf(this.language) < 0) this.options.preload.unshift(this.language)

    this.isInitialized = true
    this.emit('initialized', this)

    if (this.options.preload.length > 0) {
      const toLoad = this.options.preload.reduce((prev, curr) => {
        prev[curr] = this.seenNamespaces
        return prev
      }, {})
      await this.load(toLoad)
    }

    await this.changeLanguage(this.language)

    return this
  }

  async load (toLoad) {
    this.throwIfNotInitializedFn('load')

    for (const hook of this.readHooks) {
      const ret = hook(toLoad)
      const read = await (ret && ret.then ? ret : Promise.resolve(ret))
      if (!read) continue
      Object.keys(read).forEach((lng) => {
        Object.keys(read[lng]).forEach((ns) => {
          this.resources[lng] = this.resources[lng] || {}
          this.resources[lng][ns] = read[lng][ns]
        })
      })
      this.calculateSeenNamespaces()
      return
    }
  }

  async loadNamespace (ns, lng) {
    this.throwIfNotInitializedFn('loadNamespace')

    if (!lng) lng = this.language
    if (!lng) throw new Error('There is no language defined!')

    return this.load({
      [lng]: [ns]
    })
  }

  isLanguageLoaded (lng) {
    this.throwIfNotInitializedFn('isLanguageLoaded')

    return this.resources[lng]
  }

  isNamespaceLoaded (ns, lng) {
    this.throwIfNotInitializedFn('isNamespaceLoaded')

    if (!lng) lng = this.language
    if (!lng) throw new Error('There is no language defined!')
    return this.resources[lng] && this.resources[lng][ns]
  }

  dir (lng) {
    if (!lng) lng = this.language
    return this.services.languageUtils.dir(lng)
  }

  async changeLanguage (lng) {
    if (!lng) lng = await this.runDetectLanguageHooks()

    lng = typeof lng === 'string' ? lng : this.runBestMatchFromCodesHooks(lng)
    if (!lng) return

    this.emit('languageChanging', lng)

    await this.load({
      [lng]: this.seenNamespaces
    })
    this.language = lng
    await this.runCacheLanguageHooks(this.language)

    this.emit('languageChanged', lng)
    this.logger.log('languageChanged', lng)
  }

  t (key, options = {}) {
    this.throwIfNotInitializedFn('t')

    const lng = options.lng || this.language
    if (!lng) throw new Error('There is no language defined!')

    const ns = options.ns || this.options.defaultNS

    if (!this.isLanguageLoaded(lng)) {
      this.logger.warn(`Language ${lng} not loaded!`)
      return undefined
    }
    if (!this.isNamespaceLoaded(ns, lng)) {
      this.logger.warn(`Namespace ${ns} for language ${lng} not loaded!`)
      return undefined
    }

    if (options[this.options.pluralOptionProperty] !== undefined) {
      const resolvedKey = this.runResolvePluralHooks(options[this.options.pluralOptionProperty], key, ns, lng, options)
      return this.runTranslateHooks(resolvedKey, ns, lng, options)
    }
    return this.runTranslateHooks(key, ns, lng, options)
  }
}

export default function (options) {
  return new I18next(options)
}
