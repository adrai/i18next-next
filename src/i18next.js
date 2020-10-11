import baseLogger from './logger.js'
import { getDefaults } from './defaults.js'
import { run } from './hooks.js'
import { isIE10, wait, deepFind } from './utils.js'
import EventEmitter from './EventEmitter.js'
import ResourceStore from './ResourceStore.js'
import throwIf from './throwIf.js'
import defaultStack from './defaultStack.js'

class I18next extends EventEmitter {
  constructor (options = {}) {
    super()
    if (isIE10) EventEmitter.call(this) // <=IE10 fix (unable to call parent constructor)
    this.isInitialized = false
    const defOpt = getDefaults()
    this.loading = {}
    this.options = { ...defOpt, ...options }
    if (options.interpolation) this.options = { ...this.options, interpolation: { ...defOpt.interpolation, ...options.interpolation } }
    this.language = this.options.lng
    this.store = new ResourceStore({}, this.options)
    this.services = {
      resourceStore: this.store,
      languageUtils: {},
      interpolator: {},
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
    // if (hookNames.indexOf(name) < 0) throw new Error(`${name} is not a valid hook!`)
    throwIf.alreadyInitializedFn(this)(`addHook(${name})`)

    if (type) {
      this[`${name}Hooks`] = this[`${name}Hooks`] || {}
      this[`${name}Hooks`][type] = hook
    } else {
      this[`${name}Hooks`] = this[`${name}Hooks`] || []
      this[`${name}Hooks`].push(hook)
    }
    return this
  }

  async init () {
    throwIf.alreadyInitializedFn('Already initialized!')

    if (this.options.initImmediate === false) run(this).extendOptionsHooks()
    else await run(this).extendOptionsHooks()
    this.language = this.options.lng

    baseLogger.init(this.services.logger, this.options)
    this.logger = baseLogger
    this.services.logger = this.logger

    if (this.loadResourcesHooks) {
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
        const resources = await run(this).loadResourcesHooks()
        this.store.setData(resources)
        this.logger.log('set data', resources)
      }
    }

    this.use(defaultStack)
    if (!this.resolveHooks || this.resolveHooks.length === 0) {
      this.addHook('resolve', (key, data, options) => {
        const { ns, lng } = this.extractFromKey(typeof key === 'string' ? key : key[key.length - 1], options)
        return deepFind((data && data[lng] && data[lng][ns]) || {}, key)
      })
    }

    this.services.languageUtils = {
      // ...this.services.languageUtils,
      getBestMatchFromCodes: run(this).bestMatchFromCodesHooks,
      getFallbackCodes: run(this).fallbackCodesHooks,
      toResolveHierarchy: run(this).resolveHierarchyHooks
    }

    this.services.interpolator = {
      // ...this.services.interpolator,
      interpolate: run(this).interpolateHooks
    }

    if (this.language) this.languages = run(this).resolveHierarchyHooks(this.language)

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

    if (!this.options.isClone) this.logger.log('initialized', this.options)
    this.emit('initialized', this)

    if (!this.language && (!this.detectLanguageHooks || this.detectLanguageHooks.length === 0)) {
      this.logger.warn('init: no lng is defined and no languageDetector is used')
    }

    return this
  }

  async load (toLoad, tried = 0, delay = 350) {
    throwIf.notInitializedFn(this)('load')
    if (!this.readHooks) return

    Object.keys(toLoad).forEach((lng) => {
      toLoad[lng].forEach((ns) => {
        this.loading[lng] = this.loading[lng] || []
        if (this.loading[lng].indexOf(ns) > -1) {
          if (toLoad[lng]) {
            toLoad[lng].splice(toLoad[lng].indexOf(ns), 1)
            if (toLoad[lng].length === 0) delete toLoad[lng]
          }
          this.logger.log(`already loading namespace "${ns}" for language "${lng}", so will ignore the request to load again`)
        } else {
          this.loading[lng].push(ns)
        }
      })
    })
    if (Object.keys(toLoad).length === 0) return
    for (const hook of this.readHooks) {
      const ret = hook(toLoad)
      let read
      let shouldRetry = false
      try {
        read = await (ret && typeof ret.then === 'function' ? ret : Promise.resolve(ret))
      } catch (err) {
        if (!err.retry || tried > 5) throw err
        shouldRetry = true
      } finally {
        Object.keys(toLoad).forEach((lng) => {
          toLoad[lng].forEach((ns) => {
            this.loading[lng] = this.loading[lng] || []
            if (this.loading[lng].indexOf(ns) > -1) this.loading[lng].splice(this.loading[lng].indexOf(ns), 1)
          })
        })
      }
      if (shouldRetry) {
        await wait(delay)
        return this.load(toLoad, tried + 1, delay * 2)
      }

      if (!read) continue
      Object.keys(read).forEach((lng) => {
        Object.keys(read[lng]).forEach((ns) => {
          this.store.addResourceBundle(lng, ns, read[lng][ns])
          this.logger.log(`loaded namespace "${ns}" for language "${lng}"`, read[lng][ns])
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

    const ns = this.store.getSeenNamespaces()
    const toLoad = newLngs.reduce((prev, curr) => {
      prev[curr] = ns
      return prev
    }, {})
    try {
      return this.load(toLoad)
    } catch (err) {
      const nsPart = ns.length === 1 ? `loading namespace "${ns[0]}"` : `loading namespaces "${ns.join(',')}"`
      const lngPart = lngs.length === 1 ? `for language "${lngs[0]}"` : `for languages "${lngs.join(',')}"`
      this.logger.warn(`${nsPart} ${lngPart}`, err)
      // throw err
    }
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
      const lngs = run(this).resolveHierarchyHooks(lng)
      lngs.forEach(l => {
        if (!toLoad[l]) toLoad[l] = ns
      })
      try {
        return this.load(toLoad)
      } catch (err) {
        const nsPart = ns.length === 1 ? `loading namespace "${ns[0]}"` : `loading namespaces "${ns.join(',')}"`
        this.logger.warn(`${nsPart} for language "${lng}" failed`, err)
        // throw err
      }
    }

    // at least load fallbacks in this case
    const fallbacks = run(this).fallbackCodesHooks(this.options.fallbackLng)
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

    if (!lng) lng = await run(this).detectLanguageHooks()

    lng = typeof lng === 'string' ? lng : run(this).bestMatchFromCodesHooks(lng)
    if (!lng) return
    if (lng === this.language) return

    this.emit('languageChanging', lng)

    await this.loadLanguage(lng)
    this.language = lng
    this.languages = run(this).resolveHierarchyHooks(this.language)
    await run(this).cacheLanguageHooks(this.language)

    this.emit('languageChanged', lng)
    this.logger.log('languageChanged', lng)
  }

  setDefaultNamespace (ns) {
    this.options.defaultNS = ns
  }

  extractFromKey (key, options = {}) {
    const nsSeparator = options.nsSeparator !== undefined ? options.nsSeparator : this.options.nsSeparator
    const keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator
    let namespaces = options.ns || this.options.defaultNS
    if (nsSeparator && key.indexOf(nsSeparator) > -1 && keySeparator) {
      const parts = key.split(nsSeparator)
      if (nsSeparator !== keySeparator || (nsSeparator === keySeparator && this.options.ns && this.options.ns.indexOf(parts[0]) > -1)) {
        namespaces = parts.shift()
      }
      key = parts.join(keySeparator)
    }
    if (typeof namespaces === 'string') namespaces = [namespaces]
    const lng = options.lng || this.language
    return { key, namespaces, ns: namespaces[namespaces.length - 1], lng }
  }

  exists (key, options = {}) {
    return !!run(this).resolveHooks(key, options)
  }

  t (key, options = {}) {
    throwIf.notInitializedFn(this)('t')

    // if (this.options.overloadTranslationOptionHandler) {
    //   options = { ...options, ...this.options.overloadTranslationOptionHandler(arguments) }
    // }

    // non valid keys handling
    if (key === undefined || key === null) {
      this.logger.warn(`Key "${key}" not valid!`)
      return
    }

    // get namespace(s)
    const { key: k, ns, lng } = this.extractFromKey(typeof key === 'string' ? key : key[key.length - 1], options)

    if (!lng) throw new Error('There is no language defined!')
    if (!ns) throw new Error('There is no namespace defined!')

    if (!this.isLanguageLoaded(lng)) {
      this.logger.warn(`Language "${lng}" not loaded!`)
      return
    }
    if (!this.isNamespaceLoaded(ns, lng)) {
      this.logger.warn(`Namespace "${ns}" for language "${lng}" not loaded!`)
      return
    }

    // return key on CIMode
    const appendNamespaceToCIMode = options.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode
    if (lng && lng.toLowerCase() === 'cimode') {
      const nsSeparator = options.nsSeparator || this.options.nsSeparator
      if (appendNamespaceToCIMode && nsSeparator) return ns + nsSeparator + k
      return k
    }

    let resolved = run(this).resolveHooks(key, options)
    if (typeof resolved !== 'object') resolved = { res: resolved, usedKey: key, exactUsedKey: key, usedLng: lng }

    return run(this).translatedHooks(resolved.res, key, resolved, options)
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
