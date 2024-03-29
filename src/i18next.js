import baseLogger from './logger.js'
import { getDefaults } from './defaults.js'
import { run, runAsyncLater } from './hooks.js'
import { isIE10, wait, deepFind, looksLikeObjectPath, deepExtend } from './utils.js'
import EventEmitter from './EventEmitter.js'
import ResourceStore from './ResourceStore.js'
import throwIf from './throwIf.js'
import defaultStack from './defaultStack.js'

// binds the member functions of the given class instance so that they can be destructured.
// this way you can for example just use t() instead of i18n.t()
function bindMemberFunctions (inst) {
  const mems = Object.getOwnPropertyNames(Object.getPrototypeOf(inst))
  mems.forEach((mem) => {
    if (typeof inst[mem] === 'function') {
      inst[mem] = inst[mem].bind(inst)
    }
  })
}

function setResolvedLanguage (self, lng) {
  self.resolvedLanguage = undefined
  if (['cimode', 'dev'].indexOf(lng) > -1) return
  for (let li = 0; li < self.languages.length; li++) {
    const lngInLngs = self.languages[li]
    if (['cimode', 'dev'].indexOf(lngInLngs) > -1) continue
    if (self.store.hasLanguageSomeTranslations(lngInLngs)) {
      self.resolvedLanguage = lngInLngs
      break
    }
  }
}

class I18next extends EventEmitter {
  constructor (options = {}) {
    super()
    if (isIE10) EventEmitter.call(this) // <=IE10 fix (unable to call parent constructor)
    this.isInitialized = false
    const defOpt = getDefaults()
    this.loading = {}
    this.hookNames = [
      'extendOptions',
      'initializing',
      'loadResources',
      'read',
      'resolve',
      'detectLanguage',
      'cacheLanguage',
      'bestMatchFromCodes',
      'fallbackCodes',
      'resolveHierarchy',
      'translated'
    ]
    this.hooks = {}
    if (!options.defaultNS && options.ns) {
      if (typeof options.ns === 'string') {
        options.defaultNS = options.ns
      } else {
        options.defaultNS = options.ns[0]
      }
    }
    this.options = { ...defOpt, ...options }
    if (options.keySeparator !== undefined) {
      this.options.userDefinedKeySeparator = options.keySeparator
    }
    if (options.nsSeparator !== undefined) {
      this.options.userDefinedNsSeparator = options.nsSeparator
    }
    this.language = this.options.lng
    if (this.language) this.languages = [this.language]
    if (!this.language && this.options.fallbackLng) this.languages = Array.isArray(this.options.fallbackLng) ? [...this.options.fallbackLng] : [this.options.fallbackLng]
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
    bindMemberFunctions(this)
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

    if (module.hooks && module.hooks.length > 0) {
      module.hooks.forEach((h) => {
        if (this.hookNames.indexOf(h) < 0) this.hookNames.push(h)
      })
    }
    module.register(this)
    return this
  }

  addHook (name, type, hook) {
    if (!hook) {
      hook = type
      type = undefined
    }
    if (!hook || typeof hook !== 'function') throw new Error(`${name ? `"${name}"` : 'This'} is not a valid hook!`)
    throwIf.alreadyInitializedFn(this)(`addHook(${name})`)

    if (type) {
      this.hooks[name] = this.hooks[name] || {}
      this.hooks[name][type] = hook
    } else {
      this.hooks[name] = this.hooks[name] || []
      this.hooks[name].push(hook)
    }
    return this
  }

  async init () {
    throwIf.alreadyInitializedFn('Already initialized!')

    baseLogger.init(this._logger, this.options)
    this.logger = baseLogger

    this.use(defaultStack)
    if (!this.hooks.resolve || this.hooks.resolve.length === 0) {
      this.addHook('resolve', (key, data, options) => {
        const { ns, lng } = this.extractFromKey(typeof key === 'string' ? key : key[key.length - 1], options)
        return deepFind((data && data[lng] && data[lng][ns]) || {}, key)
      })
    }

    Object.keys(this.hooks).forEach((ah) => {
      if (this.hookNames.indexOf(ah) < 0) throw new Error(`Hook ${ah} is not a valid hook name!`)
    })

    const { sync: syncOptions, async: asyncOptions } = runAsyncLater(this.hooks.extendOptions, [{ ...this.options }])
    syncOptions.forEach((opt) => {
      this.options = deepExtend(opt, this.options)
    })
    if (asyncOptions.length > 0) {
      if (this.options.initImmediate === false) {
        const msg = 'You set initImmediate to false but are using an asynchronous extendOptions hook'
        this.logger.error(msg)
        throw new Error(msg)
      }
      (await Promise.all(asyncOptions)).forEach((opt) => {
        this.options = deepExtend(opt, this.options)
      })
    }

    const { async: asyncInit } = runAsyncLater(this.hooks.initializing, [this.options])
    if (asyncInit.length > 0) {
      if (this.options.initImmediate === false) {
        const msg = 'You set initImmediate to false but are using an asynchronous initializing hook'
        this.logger.error(msg)
        throw new Error(msg)
      }
      await Promise.all(asyncInit)
    }

    this.language = this.options.lng
    if (!this.language && this.options.fallbackLng) this.languages = [this.options.fallbackLng]
    const hasLanguageDetection = this.hooks.detectLanguage && this.hooks.detectLanguage.length > 0
    if (this.options.fallbackLng && !this.language && !hasLanguageDetection) {
      const codes = this.getFallbackCodes(this.options.fallbackLng)
      if (codes.length > 0 && codes[0] !== 'dev') this.language = codes[0]
    }

    const { sync: syncRes, async: asyncRes } = runAsyncLater(this.hooks.loadResources, [this.options])
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
    if (this.options.preload.length > 0 && this.hooks.read && this.hooks.read.length > 0) {
      const toLoad = this.options.preload.reduce((prev, curr) => {
        prev[curr] = this.store.getSeenNamespaces()
        return prev
      }, {})

      for (const hook of this.hooks.read) {
        let read = hook(toLoad)
        if (read && typeof read.then === 'function') {
          if (this.options.initImmediate === false) {
            const msg = `You set initImmediate to false but are using an asynchronous read hook (${this.hooks.read.indexOf(hook) + 1}. hook)`
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

    setResolvedLanguage(this, this.language)

    if (!this.language && !hasLanguageDetection) this.logger.warn('init: no lng is defined and no languageDetector is used')
    const hasLanguageCaching = this.hooks.cacheLanguage && this.hooks.cacheLanguage.length > 0
    if (this.options.initImmediate === false || (!hasLanguageDetection && !hasLanguageCaching)) this.changeLanguage(this.language)
    else await this.changeLanguage(this.language)

    if (!this.options.isClone) this.logger.log('initialized', this.options)
    this.emit('initialized', this)

    return this
  }

  async load (toLoad, tried = 0, delay = 350) {
    throwIf.notInitializedFn(this)('load', true)
    if (!this.hooks.read) return

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
    for (const hook of this.hooks.read) {
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
    throwIf.notInitializedFn(this)('loadLanguages', true)

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
    throwIf.notInitializedFn(this)('loadNamespaces', true)
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
    if (!this.hooks.read || this.hooks.read.length === 0) return true
    return this.store.hasResourceBundle(lng)
  }

  isNamespaceLoaded (ns, lng) {
    // we're in cimode so this shall pass
    if (!lng && this.language === 'cimode') lng = this.language
    if (lng && lng.toLowerCase() === 'cimode') return true
    if (!this.hooks.read || this.hooks.read.length === 0) return true
    return this.store.hasResourceBundle(lng, ns)
  }

  dir (lng) {
    if (!lng) lng = this.resolvedLanguage || (this.languages && this.languages.length > 0 ? this.languages[0] : this.language)
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
      'sam',
      'ckb'
    ]

    return rtlLngs.find((l) => lng.toLowerCase().indexOf(l) > -1) > -1 || lng.toLowerCase().indexOf('-arab') > 1
      ? 'rtl'
      : 'ltr'
  }

  getBestMatchFromCodes (lngs) {
    return run(this).bestMatchFromCodes(lngs)
  }

  getFallbackCodes (fallbackLng, lng) {
    return run(this).fallbackCodes(fallbackLng, lng)
  }

  toResolveHierarchy (lng, fallbackLng) {
    return run(this).resolveHierarchy(lng, fallbackLng)
  }

  async cacheLanguage (lng) {
    return run(this).cacheLanguage(lng)
  }

  async detectLanguage (...args) {
    return run(this).detectLanguage.apply(this, args)
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
    setResolvedLanguage(this, lng)
    await this.cacheLanguage(this.language)

    this.emit('languageChanged', lng)
    this.logger.log('languageChanged', lng)
  }

  setDefaultNamespace (ns) {
    this.options.defaultNS = ns
  }

  extractFromKey (key, options = {}) {
    let namespaces = options.ns || this.options.defaultNS
    const nsSeparator = options.nsSeparator !== undefined ? options.nsSeparator : this.options.nsSeparator
    const keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator
    const wouldCheckForNsInKey = nsSeparator && key.indexOf(nsSeparator) > -1
    const seemsNaturalLanguage =
      !this.options.userDefinedKeySeparator &&
      !options.keySeparator &&
      !this.options.userDefinedNsSeparator &&
      !options.nsSeparator &&
      !looksLikeObjectPath(key, nsSeparator, keySeparator)
    if (wouldCheckForNsInKey && !seemsNaturalLanguage) {
      const parts = key.split(nsSeparator)
      if (nsSeparator !== keySeparator || (nsSeparator === keySeparator && this.options.ns && this.options.ns.indexOf(parts[0]) > -1)) {
        namespaces = parts.shift()
      }
      key = parts.join(keySeparator || '')
    }
    if (typeof namespaces === 'string') namespaces = [namespaces]
    const lng = options.lng || this.language
    return { key, namespaces, ns: namespaces[namespaces.length - 1], lng }
  }

  exists (key, options = {}) {
    if (key === undefined || key === null) return false
    return !!run(this).resolve(key, options)
  }

  t (key, options = {}) {
    throwIf.notInitializedFn(this)('t', true)

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

    let resolved = run(this).resolve(key, options)
    if (typeof resolved !== 'object') resolved = { res: resolved, usedKey: key, exactUsedKey: key, usedLng: lng }

    return run(this).translated(resolved.res, key, resolved, options)
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

  toJSON () {
    return {
      options: this.options,
      store: this.store,
      language: this.language,
      languages: this.languages,
      resolvedLanguage: this.resolvedLanguage
    }
  }
}

export default function (options) {
  return new I18next(options)
}
