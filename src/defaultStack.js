import { deepFind } from './utils.js'
import LanguageUtils from './LanguageUtils.js'
import Interpolator from './Interpolator.js'
import { run as runH, runHooks } from './hooks.js'

const getI18nextFormat = (i18n) => {
  const run = runH(i18n)
  const runSpecific = {
    postProcess (postProcessorNames, value, key, opt) {
      if (!i18n.hooks.postProcess) return value
      postProcessorNames.forEach((n) => {
        if (i18n.hooks.postProcess[n]) {
          value = i18n.hooks.postProcess[n](value, key, opt)
        } else {
          i18n.logger.warn(`No post processor found with name "${n}"`)
        }
      })
      return value
    },

    parseI18nFormat (res, options, lng, ns, key, info) {
      if (!i18n.hooks.parseI18nFormat) return res
      for (const hook of i18n.hooks.parseI18nFormat) {
        const parsed = hook(res, options, lng, ns, key, info)
        if (parsed !== undefined) return parsed
      }
      return res
    },

    addI18nFormatLookupKeys (finalKeys, key, code, ns, options) {
      if (!i18n.hooks.addI18nFormatLookupKeys) return
      i18n.hooks.addI18nFormatLookupKeys.forEach((hook) => hook(finalKeys, key, code, ns, options))
    },

    async handleMissingKey (key, ns, lng, value, options) {
      if (!i18n.hooks.handleMissingKey) return
      return runHooks(i18n.hooks.handleMissingKey, [key, ns, lng, value, options])
    },

    async handleUpdateKey (key, ns, lng, value, options) {
      if (!i18n.hooks.handleUpdateKey) return
      return runHooks(i18n.hooks.handleUpdateKey, [key, ns, lng, value, options])
    },

    resolveContext (context, key, options) {
      if (!i18n.hooks.resolveContext) return
      for (const hook of i18n.hooks.resolveContext) {
        const resolvedKey = hook(context, key, options)
        if (resolvedKey !== undefined) return resolvedKey
      }
    },

    formPlurals (key, lng, options) {
      if (!i18n.hooks.formPlurals) return
      for (const hook of i18n.hooks.formPlurals) {
        const resolvedKeys = hook(key, lng, options)
        if (resolvedKeys !== undefined && resolvedKeys.length) return resolvedKeys
      }
    },

    resolvePlural (count, key, lng, options) {
      if (!i18n.hooks.resolvePlural) return
      for (const hook of i18n.hooks.resolvePlural) {
        const resolvedKey = hook(count, key, lng, options)
        if (resolvedKey !== undefined) return resolvedKey
      }
    },

    resolveKey (key, ns, lng, data, options) {
      if (!i18n.hooks.resolveKey) return
      for (const hook of i18n.hooks.resolveKey) {
        const resolvedValue = hook(key, ns, lng, data, options)
        if (resolvedValue !== undefined) return resolvedValue
      }
    },

    interpolate (key, res, data, lng, options) {
      if (!i18n.hooks.interpolate) return res
      for (const hook of i18n.hooks.interpolate) {
        const interpolated = hook(key, res, data, lng, options)
        if (interpolated !== undefined && interpolated !== res) return interpolated
      }
      return res
    }
  }
  return {
    isValidLookup (res) {
      return (
        res !== undefined &&
        !(!i18n.options.returnNull && res === null) &&
        !(!i18n.options.returnEmptyString && res === '')
      )
    },

    resolve (keys, data, options = {}) {
      if (typeof keys === 'string') keys = [keys]
      let found, usedKey, exactUsedKey, usedLng, usedNS

      const codes = options.lngs ? options.lngs : run.resolveHierarchy(options.lng || i18n.language, options.fallbackLng)

      // forEach possible key
      keys.forEach((k) => {
        if (this.isValidLookup(found)) return

        const extracted = i18n.extractFromKey(k, options)
        const key = extracted.key
        usedKey = key
        let namespaces = extracted.namespaces
        if (i18n.options.fallbackNS) namespaces = namespaces.concat(i18n.options.fallbackNS)

        namespaces.forEach(ns => {
          if (this.isValidLookup(found)) return

          usedNS = ns

          if (!i18n.isNamespaceLoaded(usedNS)) {
            i18n.logger.warn(
              `key "${usedKey}" for languages "${codes.join(
                ', '
              )}" won't get resolved as namespace "${usedNS}" was not yet loaded`,
              'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!'
            )
          }

          codes.forEach((code) => {
            if (this.isValidLookup(found)) return
            usedLng = code

            const finalKeys = [key]
            exactUsedKey = finalKeys[finalKeys.length - 1]

            runSpecific.addI18nFormatLookupKeys(finalKeys, key, code, ns, options)

            if (options[i18n.options.pluralOptionProperty] !== undefined) {
              const resolvedKey = runSpecific.resolvePlural(options[i18n.options.pluralOptionProperty], key, code, options)
              finalKeys.push(resolvedKey)
            }

            if (options[i18n.options.contextOptionProperty] !== undefined) {
              const resolvedKey = runSpecific.resolveContext(options[i18n.options.contextOptionProperty], key, options)
              finalKeys.push(resolvedKey)
            }

            if (options[i18n.options.pluralOptionProperty] !== undefined && options[i18n.options.contextOptionProperty] !== undefined) {
              let resolvedKey = runSpecific.resolveContext(options[i18n.options.contextOptionProperty], key, options)
              if (resolvedKey) {
                resolvedKey = runSpecific.resolvePlural(options[i18n.options.pluralOptionProperty], resolvedKey, code, options)
                finalKeys.push(resolvedKey)
              }
            }

            // iterate over finalKeys starting with most specific pluralkey (-> contextkey only) -> singularkey only
            let possibleKey
            while ((possibleKey = finalKeys.pop()) && !this.isValidLookup(found)) {
              exactUsedKey = possibleKey
              found = runSpecific.resolveKey(possibleKey, ns, code, data, options)
            }
          })
        })
      })

      if (found === undefined) return
      return { res: found, usedKey, exactUsedKey, usedLng, usedNS }
    },

    extendTranslation (res, key, resolved, options = {}) {
      if (res === undefined) return res

      const newRes = runSpecific.parseI18nFormat(
        res,
        options,
        resolved.usedLng,
        resolved.usedNS,
        resolved.usedKey,
        { resolved }
      )

      const skipInterpolation = options.skipInterpolation !== undefined ? options.skipInterpolation : i18n.options.skipInterpolation
      if (res === newRes && !skipInterpolation) {
        let data = options.replace && typeof options.replace !== 'string' ? options.replace : options
        if (i18n.options.interpolation.defaultVariables) data = { ...i18n.options.interpolation.defaultVariables, ...data }
        res = runSpecific.interpolate(key, res, data, options.lng || i18n.language, options)
      } else {
        res = newRes
      }

      const postProcess = options.postProcess || i18n.options.postProcess
      const postProcessorNames = typeof postProcess === 'string' ? [postProcess] : postProcess
      if (res !== undefined && postProcessorNames && postProcessorNames.length && options.applyPostProcessor !== false) {
        res = runSpecific.postProcess(postProcessorNames, res, key, options)
      }

      return res
    },

    handleMissing (res, resExactUsedKey, key, ns, lng, options = {}) {
      if (lng !== undefined && ns !== undefined) {
        if (res === undefined) i18n.logger.warn(`No value found for key "${resExactUsedKey}" in namespace "${ns}" for language "${lng}"!`)

        // string, empty or null
        let usedDefault = false
        let usedKey = false

        // fallback value
        if (!this.isValidLookup(res) && options.defaultValue !== undefined) {
          usedDefault = true
          if (options[i18n.options.pluralOptionProperty] !== undefined) {
            const pluralKey = runSpecific.resolvePlural(options[i18n.options.pluralOptionProperty], 'defaultValue', lng, options)
            res = options[pluralKey]
          }
          if (!res) res = options.defaultValue
        }

        if (!this.isValidLookup(res)) {
          usedKey = true
          res = key
        }

        // save missing
        const updateMissing = options.defaultValue && options.defaultValue !== res && i18n.options.updateMissing
        if (usedKey || usedDefault || updateMissing) {
          i18n.logger.log(
            updateMissing ? 'updateKey' : 'missingKey',
            lng,
            ns,
            key,
            updateMissing ? options.defaultValue : res
          )

          let lngs = []
          const fallbackLngs = run.fallbackCodes(i18n.options.fallbackLng, lng)
          if (i18n.options.saveMissingTo === 'fallback' && fallbackLngs && fallbackLngs[0]) {
            for (let i = 0; i < fallbackLngs.length; i++) lngs.push(fallbackLngs[i])
          } else if (i18n.options.saveMissingTo === 'all') {
            lngs = run.resolveHierarchy(lng)
          } else {
            lngs.push(lng)
          }

          if (i18n.options.saveMissing || i18n.options.updateMissing) {
            if (!i18n.isNamespaceLoaded(ns)) {
              i18n.logger.warn(
                `did not save key "${key}" as the namespace "${ns}" was not yet loaded`,
                'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the Promise to resolve before accessing it!!!'
              )
              return res
            }
            const send = async (l, k) => {
              if (updateMissing) {
                i18n.emit('updateKey', l, ns, k, options.defaultValue || res)
                await runSpecific.handleUpdateKey(k, ns, l, options.defaultValue || res, options)
              } else {
                i18n.emit('missingKey', l, ns, k, options.defaultValue || res)
                await runSpecific.handleMissingKey(k, ns, l, options.defaultValue || res, options)
              }
            }

            const needsPluralHandling = options[i18n.options.pluralOptionProperty] !== undefined && typeof options[i18n.options.pluralOptionProperty] !== 'string'
            if (i18n.options.saveMissingPlurals && needsPluralHandling) {
              lngs.forEach((l) => {
                const plurals = runSpecific.formPlurals(key, l, options)
                plurals.forEach(p => send([l], p))
              })
            } else {
              send(lngs, key)
            }
          }
        }
      }
      return res
    },

    translated (res, keys, resolved, options) {
      const { key, ns, namespaces, lng } = i18n.extractFromKey(typeof keys === 'string' ? keys : keys[keys.length - 1], options)
      const resUsedKey = (resolved && resolved.usedKey) || key
      const resExactUsedKey = (resolved && resolved.exactUsedKey) || key

      options.applyPostProcessor = options.applyPostProcessor !== undefined ? options.applyPostProcessor : true
      const joinArrays = options.joinArrays !== undefined ? options.joinArrays : i18n.options.joinArrays
      const joinActive = typeof joinArrays === 'string'
      if (res !== undefined) {
        const handleAsObject = typeof res !== 'string' && typeof res !== 'boolean' && typeof res !== 'number'
        const keySeparator = options.keySeparator !== undefined ? options.keySeparator : i18n.options.keySeparator
        if (handleAsObject && keySeparator) {
          const resType = Object.prototype.toString.apply(res)
          const resTypeIsArray = resType === '[object Array]'
          const copy = resTypeIsArray ? [] : {} // apply child translation on a copy
          const newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey
          for (const m in res) {
            if (Object.prototype.hasOwnProperty.call(res, m)) {
              const deepKey = `${newKeyToUse}${keySeparator}${m}`
              copy[m] = i18n.t(deepKey, {
                ...options,
                ...{ joinArrays: false, ns: namespaces, applyPostProcessor: !joinActive }
              })
              options.applyPostProcessor = joinActive
              if (copy[m] === deepKey) copy[m] = res[m] // if nothing found use orginal value as fallback
            }
          }
          res = copy
          if (resTypeIsArray && joinActive) {
            // array special treatment
            res = res.join(joinArrays)
          }
        }
      }

      // handle missing
      res = this.handleMissing(res, resExactUsedKey, key, ns, lng, options)

      // extend
      res = this.extendTranslation(res, keys, resolved, options)

      return res
    }
  }
}

const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;'
}

const escape = (data) => {
  if (typeof data === 'string') {
    // eslint-disable-next-line no-useless-escape
    return data.replace(/[&<>"'\/]/g, s => entityMap[s])
  }
  return data
}

export function getDefaults () {
  return {
    pluralOptionProperty: 'count',
    contextOptionProperty: 'context',
    fallbackNS: false, // string or array of namespaces
    supportedLngs: false, // array with supported languages
    nonExplicitSupportedLngs: false,
    load: 'all', // | currentOnly | languageOnly
    pluralSeparator: '_',
    contextSeparator: '_',
    saveMissing: false, // enable to send missing values
    updateMissing: false, // enable to update default values if different from translated value (only useful on initial development, or when keeping code as source of truth)
    saveMissingTo: 'fallback', // 'current' || 'all'
    saveMissingPlurals: true, // will save all forms not only singular key
    returnNull: true, // allows null value as valid translation
    returnEmptyString: true, // allows empty string value as valid translation
    skipInterpolation: false,
    interpolation: {
      format: (value, format, lng, options) => value,
      formatSeparator: ',',
      escapeValue: true,
      prefix: '{{',
      suffix: '}}',
      unescapePrefix: '-',
      unescapeSuffix: '',
      defaultVariables: {},
      escape,
      maxReplaces: 1000, // max replaces to prevent endless loop
      missingInterpolationHandler: false // function(str, match)
    }
  }
}

export function extendOptions (opt) {
  const defaultOptions = getDefaults()
  let options = { ...defaultOptions, ...opt }
  if (opt.interpolation) options = { ...options, interpolation: { ...defaultOptions.interpolation, ...opt.interpolation } }
  if (opt.interpolation && opt.interpolation.defaultVariables) options.interpolation.defaultVariables = opt.interpolation.defaultVariables
  return options
}

const stack = {
  hooks: [
    'resolveKey',
    'resolveContext',
    'resolvePlural',
    'formPlurals',
    'interpolate',
    'postProcess',
    'handleMissingKey',
    'handleUpdateKey',
    'parseI18nFormat',
    'addI18nFormatLookupKeys'
  ],
  register: (i18n) => {
    let languageUtils
    let interpolator

    const i18nextFormat = getI18nextFormat(i18n)
    i18n.addHook('extendOptions', (opt) => extendOptions(opt))
    i18n.addHook('initializing', (options) => {
      languageUtils = new LanguageUtils(options)
      interpolator = new Interpolator(options.interpolation)
    })

    i18n.addHook('resolve', (key, data, options) => i18nextFormat.resolve(key, data, options))
    i18n.addHook('resolveKey', (key, ns, lng, data, options) => deepFind((data && data[lng] && data[lng][ns]) || {}, key, options && options.keySeparator !== undefined ? options.keySeparator : i18n.options.keySeparator))
    i18n.addHook('translated', (res, keys, resolved, options) => i18nextFormat.translated(res, keys, resolved, options))

    i18n.addHook('bestMatchFromCodes', (lngs) => languageUtils.getBestMatchFromCodes(lngs))
    i18n.addHook('fallbackCodes', (fallbackLng, lng) => languageUtils.getFallbackCodes(fallbackLng, lng))
    i18n.addHook('resolveHierarchy', (lng, fallbackLng) => languageUtils.toResolveHierarchy(lng, fallbackLng))

    i18n.addHook('resolveContext', (context, key, options) => `${key}${i18n.options.contextSeparator}${context}`)
    i18n.addHook('resolvePlural', (count, key, lng, options) => `${key}${i18n.options.pluralSeparator}${new Intl.PluralRules(lng, { type: options.ordinal ? 'ordinal' : 'cardinal' }).select(count)}`)
    i18n.addHook('formPlurals', (key, lng, options) => {
      const pr = new Intl.PluralRules(lng, { type: options.ordinal ? 'ordinal' : 'cardinal' })
      return pr.resolvedOptions().pluralCategories.map((form) => `${key}${i18n.options.pluralSeparator}${form}`)
    })
    i18n.addHook('interpolate', (key, value, data, lng, options) => interpolator.interpolate(value, data, lng, options))
  }
}

export default stack
