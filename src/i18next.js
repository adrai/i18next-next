import { getDefaults } from './defaults.js'
import { hookNames, runHooks } from './hooks.js'
import { isIE10 } from './utils.js'
import EventEmitter from './EventEmitter.js'

class I18next extends EventEmitter {
  constructor (options = {}) {
    super()
    if (isIE10) EventEmitter.call(this) // <=IE10 fix (unable to call parent constructor)
    this.isInitialized = false
    hookNames.forEach((name) => {
      this[`${name}Hooks`] = []
    })
    this.resources = {}
    this.options = { ...getDefaults(), ...options }
  }

  throwIfAlreadyInitialized (msg) {
    if (this.isInitialized) throw new Error(msg)
  }

  throwIfNotInitialized (msg) {
    if (!this.isInitialized) throw new Error(msg)
  }

  async runExtendOptionsHooks () {
    const allOptions = await runHooks(this.extendOptionsHooks, [{ ...this.options }])
    allOptions.forEach((opt) => {
      this.options = { ...opt, ...this.options }
    })
  }

  async runLoadResourcesHooks () {
    const allResources = await runHooks(this.loadResourcesHooks, [])
    return allResources.reduce((prev, curr) => ({ ...prev, ...curr }), {})
  }

  runResolvePluralHooks (key, count, options) {
    for (const hook of this.resolvePluralHooks) {
      const resolvedKey = hook(key, count, options)
      if (resolvedKey !== undefined) return resolvedKey
    }
  }

  runTranslateHooks (key, options) {
    for (const hook of this.translateHooks) {
      const resolvedValue = hook(key, this.resources, options)
      if (resolvedValue !== undefined) return resolvedValue
    }
  }

  /**
   * public api
   */

  addHook (name, hook) {
    if (hookNames.indexOf(name) < 0) throw new Error(`${name} is not a valid hook!`)
    this.throwIfAlreadyInitialized(`Cannot call "addHook(${name})" when i18next instance is already initialized!`)

    this[`${name}Hooks`].push(hook)
    return this
  }

  async init () {
    this.throwIfAlreadyInitialized('Already initialized!')

    await this.runExtendOptionsHooks()
    this.resources = await this.runLoadResourcesHooks()

    this.addHook('resolvePlural', (key, count, options) => `${key}_plural`)
    this.addHook('translate', (key, res, options) => res[key])

    this.isInitialized = true
    this.emit('initialized', this)
    return this
  }

  t (key, options = {}) {
    this.throwIfNotInitialized('Cannot use t function when i18next instance is not yet initialized!')

    if (options[this.options.pluralOptionProperty] !== undefined) {
      const resolvedKey = this.runResolvePluralHooks(key, options[this.options.pluralOptionProperty], options)
      return this.runTranslateHooks(resolvedKey, options)
    }
    return this.runTranslateHooks(key, options)
  }
}

export default function (options) {
  return new I18next(options)
}
