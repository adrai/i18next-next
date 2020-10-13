import baseLogger from './logger.js'
import { getDefaults } from './defaults.js'
import { run, runAsyncLater } from './hooks.js'
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
    if (options.interpolation && options.interpolation.defaultVariables) this.options.interpolation.defaultVariables = options.interpolation.defaultVariables
    this.language = this.options.lng
    if (this.language) this.languages = [this.language]
    if (!this.language && this.options.fallbackLng) this.languages = [this.options.fallbackLng]
    this.store = new ResourceStore({}, this.options)

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
      this._logger = module
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

    baseLogger.init(this._logger, this.options)
    this.logger = baseLogger

    const { sync: syncOptions, async: asyncOptions } = runAsyncLater(this.extendOptionsHooks, [{ ...this.options }])
    syncOptions.forEach((opt) => {
      this.options = { ...opt, ...this.options }
    })
    if (asyncOptions.length > 0) {
      if (this.options.initImmediate === false) {
        const msg = 'You set initImmediate to false but are using an asynchronous extendOptions hook'
        this.logger.error(msg)
        throw new Error(msg)
      }
      (await Promise.all(asyncOptions)).forEach((opt) => {
        this.options = { ...opt, ...this.options }
      })
    }

    this.use(defaultStack)
    if (!this.resolveHooks || this.resolveHooks.length === 0) {
      this.addHook('resolve', (key, data, options) => {
        const { ns, lng } = this.extractFromKey(typeof key === 'string' ? key : key[key.length - 1], options)
        return deepFind((data && data[lng] && data[lng][ns]) || {}, key)
      })
    }

    this.language = this.options.lng
    if (!this.language && this.options.fallbackLng) this.languages = [this.options.fallbackLng]

    const { sync: syncRes, async: asyncRes } = runAsyncLater(this.loadResourcesHooks, [this.options])
    let resources = syncRes.reduce((prev, curr) => ({ ...prev, ...curr }), {})
    if (asyncRes.length > 0) {
      if (this.options.initImmediate === false) {
        const msg = 'You set initImmediate to false but are using an asynchronous loadResources hook'
        this.logger.error(msg)
        throw new Error(msg)
      }
      resources = (await Promise.all(asyncRes)).reduce((prev, curr) => ({ ...prev, ...curr }), resources)
    }
    if (Object.keys(resources).length > 0) {
      this.store.setData(resources)
      this.logger.log('set data', resources)
    }

    if (this.language) this.languages = this.toResolveHierarchy(this.language)

    if (this.language && this.options.preload.indexOf(this.language) < 0) this.options.preload.unshift(this.language)

    this.isInitialized = true
    if (this.options.preload.length > 0 && this.readHooks && this.readHooks.length > 0) {
      const toLoad = this.options.preload.reduce((prev, curr) => {
        prev[curr] = this.store.getSeenNamespaces()
        return prev
      }, {})

      for (const hook of this.readHooks) {
        let read = hook(toLoad)
        if (read && typeof read.then === 'function') {
          if (this.options.initImmediate === false) {
            const msg = `You set initImmediate to false but are using an asynchronous read hook (${this.readHooks.indexOf(hook) + 1}. hook)`
            this.logger.error(msg, hook.toString())
            throw new Error(msg)
          } else {
            read = await read
          }
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
    }

    const hasLanguageDetection = this.detectLanguageHooks && this.detectLanguageHooks.length > 0
    if (!this.language && !hasLanguageDetection) this.logger.warn('init: no lng is defined and no languageDetector is used')
    const hasLanguageCaching = this.cacheLanguageHooks && this.cacheLanguageHooks.length > 0
    if (this.options.initImmediate === false || (!hasLanguageDetection && !hasLanguageCaching)) this.changeLanguage(this.language)
    else await this.changeLanguage(this.language)

    if (!this.options.isClone) this.logger.log('initialized', this.options)
    this.emit('initialized', this)

    return this
  }

  async load (toLoad, tried = 0, delay = 350) {
    // throwIf.notInitializedFn(this)('load')
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
      let read
      let shouldRetry = false
      try {
        const ret = hook(toLoad)
        read = await (ret && typeof ret.then === 'function' ? ret : Promise.resolve(ret))
      } catch (err) {
        if (!err.retry || tried > 5) {
          Object.keys(toLoad).forEach((lng) => {
            toLoad[lng].forEach((ns) => {
              this.store.addResourceBundle(lng, ns, {}, { silent: true })
            })
          })
          throw err
        }
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
    // throwIf.notInitializedFn(this)('loadLanguages')

    if (typeof lngs === 'string') lngs = [lngs]
    const newLngs = lngs.filter((lng) => typeof lng === 'string' && this.options.preload.indexOf(lng) < 0)
    // Exit early if all given languages are already preloaded
    if (!newLngs.length) return

    this.options.preload = this.options.preload.concat(newLngs)

    const ns = this.store.getSeenNamespaces()
    const toLoad = newLngs.reduce((prev, curr) => {
      prev[curr] = ns
      return prev
    }, {})
    try {
      await this.load(toLoad)
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
    // throwIf.notInitializedFn(this)('loadNamespaces')
    if (typeof ns === 'string') ns = [ns]

    if (lng && typeof lng !== 'string') lng = this.language
    if (!lng) lng = this.language
    let toLoad
    if (lng) {
      toLoad = {
        [lng]: ns
      }
      const lngs = this.toResolveHierarchy(lng)
      lngs.forEach(l => {
        if (!toLoad[l]) toLoad[l] = ns
      })
    } else {
      // at least load fallbacks in this case
      const fallbacks = this.getFallbackCodes(this.options.fallbackLng)
      toLoad = fallbacks.reduce((prev, curr) => {
        prev[curr] = ns
        return prev
      }, {})
    }

    try {
      await this.load(toLoad)
    } catch (err) {
      const nsPart = ns.length === 1 ? `loading namespace "${ns[0]}"` : `loading namespaces "${ns.join(',')}"`
      this.logger.warn(`${nsPart} for language "${lng}" failed`, err)
      // throw err
    }
  }

  async loadNamespace (ns, lng) {
    return this.loadNamespaces(ns, lng)
  }

  isLanguageLoaded (lng) {
    // we're in cimode so this shall pass
    if (!lng && this.language === 'cimode') lng = this.language
    if (lng && lng.toLowerCase() === 'cimode') return true
    if (!this.readHooks || this.readHooks.length === 0) return true
    return this.store.hasResourceBundle(lng)
  }

  isNamespaceLoaded (ns, lng) {
    // we're in cimode so this shall pass
    if (!lng && this.language === 'cimode') lng = this.language
    if (lng && lng.toLowerCase() === 'cimode') return true
    if (!this.readHooks || this.readHooks.length === 0) return true
    return this.store.hasResourceBundle(lng, ns)
  }

  dir (lng) {
    if (!lng) lng = this.language
    if (!lng) return 'rtl'

    const rtlLngs = [
      'ar',
      'shu',
      'sqr',
      'ssh',
      'xaa',
      'yhd',
      'yud',
      'aao',
      'abh',
      'abv',
      'acm',
      'acq',
      'acw',
      'acx',
      'acy',
      'adf',
      'ads',
      'aeb',
      'aec',
      'afb',
      'ajp',
      'apc',
      'apd',
      'arb',
      'arq',
      'ars',
      'ary',
      'arz',
      'auz',
      'avl',
      'ayh',
      'ayl',
      'ayn',
      'ayp',
      'bbz',
      'pga',
      'he',
      'iw',
      'ps',
      'pbt',
      'pbu',
      'pst',
      'prp',
      'prd',
      'ug',
      'ur',
      'ydd',
      'yds',
      'yih',
      'ji',
      'yi',
      'hbo',
      'men',
      'xmn',
      'fa',
      'jpr',
      'peo',
      'pes',
      'prs',
      'dv',
      'sam'
    ]

    return rtlLngs.find((l) => lng.toLowerCase().indexOf(l) > -1) >= 0
      ? 'rtl'
      : 'ltr'
  }

  getBestMatchFromCodes (lngs) {
    return run(this).bestMatchFromCodesHooks(lngs)
  }

  getFallbackCodes (fallbackLng, lng) {
    return run(this).fallbackCodesHooks(fallbackLng, lng)
  }

  toResolveHierarchy (lng, fallbackLng) {
    return run(this).resolveHierarchyHooks(lng, fallbackLng)
  }

  async cacheLanguage (lng) {
    return run(this).cacheLanguageHooks(lng)
  }

  async detectLanguage (...args) {
    return run(this).detectLanguageHooks.apply(this, args)
  }

  async changeLanguage (lng) {
    throwIf.notInitializedFn(this)('changeLanguage')

    if (!lng) lng = await this.detectLanguage()

    if (typeof lng !== 'string' && !Array.isArray(lng)) lng = undefined

    lng = typeof lng === 'string' ? lng : this.getBestMatchFromCodes(lng)
    if (!lng) return
    if (lng === this.language) return

    this.emit('languageChanging', lng)

    await this.loadLanguage(lng)
    this.language = lng
    this.languages = this.toResolveHierarchy(this.language)
    await this.cacheLanguage(this.language)

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
    // throwIf.notInitializedFn(this)('t')

    if (this.options.overloadTranslationOptionHandler) {
      options = { ...options, ...this.options.overloadTranslationOptionHandler(arguments) }
    }

    // non valid keys handling
    if (key === undefined || key === null) {
      this.logger.warn(`Key "${key}" not valid!`)
      return
    }

    // get namespace(s)
    const { key: k, ns, lng } = this.extractFromKey(typeof key === 'string' ? key : key[key.length - 1], options)

    // if (!lng) throw new Error('There is no language defined!')
    // if (!ns) throw new Error('There is no namespace defined!')

    // if (!this.isLanguageLoaded(lng)) {
    //   this.logger.warn(`Language "${lng}" not loaded!`)
    //   return
    // }
    // if (!this.isNamespaceLoaded(ns, lng)) {
    //   this.logger.warn(`Namespace "${ns}" for language "${lng}" not loaded!`)
    //   return
    // }

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
      let options
      if (typeof opts !== 'object') {
        options = this.options.overloadTranslationOptionHandler([key, opts].concat(rest))
      } else {
        options = { ...opts }
      }

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

  clone (options = {}) {
    const mergedOptions = { ...this.options, ...options, ...{ isClone: true } }
    mergedOptions.lng = mergedOptions.lng || this.language
    const clone = new I18next(mergedOptions)
    const membersToCopy = ['store', 'languages']
    membersToCopy.forEach((m) => {
      clone[m] = this[m]
    })
    if (mergedOptions.initImmediate === false) {
      clone.init()
      return clone
    } else {
      return clone.init()
    }
  }
}

export default function (options) {
  return new I18next(options)
}
