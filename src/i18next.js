import baseLogger from './logger.js'
import { getDefaults } from './defaults.js'
import { hookNames, runHooks } from './hooks.js'
import { isIE10 } from './utils.js'
import EventEmitter from './EventEmitter.js'

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

    this.addHook('resolvePlural', (count, key, ns, lng, options) => `${key}_plural`)
    this.addHook('translate', (key, ns, lng, res, options) => res[lng][ns][key])

    this.isInitialized = true
    this.emit('initialized', this)
    return this
  }

  async load (toLoad) {
    // TODO: load from backend... if any...
  }

  async loadNamespace (ns, lng) {
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
