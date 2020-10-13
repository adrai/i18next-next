import { deepFind } from './utils.js'
import LanguageUtils from './LanguageUtils.js'
import Interpolator from './Interpolator.js'
import { run as runH, runHooks } from './hooks.js'

const getI18nextFormat = (i18n) => {
  const run = runH(i18n)
  const runSpecific = {
    postProcessHooks (postProcessorNames, value, key, opt) {
      if (!i18n.postProcessHooks) return value
      postProcessorNames.forEach((n) => {
        if (i18n.postProcessHooks[n]) {
          value = i18n.postProcessHooks[n](value, key, opt)
        } else {
          i18n.logger.warn(`No post processor found with name "${n}"`)
        }
      })
      return value
    },

    parseI18nFormatHooks (res, options, lng, ns, key, info) {
      if (!i18n.parseI18nFormatHooks) return res
      for (const hook of i18n.parseI18nFormatHooks) {
        const parsed = hook(res, options, lng, ns, key, info)
        if (parsed !== undefined) return parsed
      }
      return res
    },

    addI18nFormatLookupKeysHooks (finalKeys, key, code, ns, options) {
      if (!i18n.addI18nFormatLookupKeysHooks) return
      i18n.addI18nFormatLookupKeysHooks.forEach((hook) => hook(finalKeys, key, code, ns, options))
    },

    async handleMissingKeyHooks (key, ns, lng, value, options) {
      if (!i18n.handleMissingKeyHooks) return
      return runHooks(i18n.handleMissingKeyHooks, [key, ns, lng, value, options])
    },

    async handleUpdateKeyHooks (key, ns, lng, value, options) {
      if (!i18n.handleUpdateKeyHooks) return
      return runHooks(i18n.handleUpdateKeyHooks, [key, ns, lng, value, options])
    },

    resolveContextHooks (context, key, options) {
      if (!i18n.resolveContextHooks) return
      for (const hook of i18n.resolveContextHooks) {
        const resolvedKey = hook(context, key, options)
        if (resolvedKey !== undefined) return resolvedKey
      }
    },

    formPluralsHooks (key, lng, options) {
      if (!i18n.formPluralsHooks) return
      for (const hook of i18n.formPluralsHooks) {
        const resolvedKeys = hook(key, lng, options)
        if (resolvedKeys !== undefined && resolvedKeys.length) return resolvedKeys
      }
    },

    resolvePluralHooks (count, key, lng, options) {
      if (!i18n.resolvePluralHooks) return
      for (const hook of i18n.resolvePluralHooks) {
        const resolvedKey = hook(count, key, lng, options)
        if (resolvedKey !== undefined) return resolvedKey
      }
    },

    resolveKeyHooks (key, ns, lng, data, options) {
      if (!i18n.resolveKeyHooks) return
      for (const hook of i18n.resolveKeyHooks) {
        const resolvedValue = hook(key, ns, lng, data, options)
        if (resolvedValue !== undefined) return resolvedValue
      }
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

      const codes = options.lngs ? options.lngs : run.resolveHierarchyHooks(options.lng || i18n.language, options.fallbackLng)

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

            runSpecific.addI18nFormatLookupKeysHooks(finalKeys, key, code, ns, options)

            if (options[i18n.options.pluralOptionProperty] !== undefined) {
              const resolvedKey = runSpecific.resolvePluralHooks(options[i18n.options.pluralOptionProperty], key, code, options)
              finalKeys.push(resolvedKey)
            }

            if (options[i18n.options.contextOptionProperty] !== undefined) {
              const resolvedKey = runSpecific.resolveContextHooks(options[i18n.options.contextOptionProperty], key, options)
              finalKeys.push(resolvedKey)
            }

            if (options[i18n.options.pluralOptionProperty] !== undefined && options[i18n.options.contextOptionProperty] !== undefined) {
              let resolvedKey = runSpecific.resolveContextHooks(options[i18n.options.contextOptionProperty], key, options)
              if (resolvedKey) {
                resolvedKey = runSpecific.resolvePluralHooks(options[i18n.options.pluralOptionProperty], resolvedKey, code, options)
                finalKeys.push(resolvedKey)
              }
            }

            // iterate over finalKeys starting with most specific pluralkey (-> contextkey only) -> singularkey only
            let possibleKey
            while ((possibleKey = finalKeys.pop()) && !this.isValidLookup(found)) {
              exactUsedKey = possibleKey
              found = runSpecific.resolveKeyHooks(possibleKey, ns, code, data, options)
            }
          })
        })
      })

      if (found === undefined) return
      return { res: found, usedKey, exactUsedKey, usedLng, usedNS }
    },

    extendTranslation (res, key, resolved, options = {}) {
      if (res === undefined) return res

      const newRes = runSpecific.parseI18nFormatHooks(
        res,
        options,
        resolved.usedLng,
        resolved.usedNS,
        resolved.usedKey,
        { resolved }
      )

      if (res === newRes && !options.skipInterpolation) {
        let data = options.replace && typeof options.replace !== 'string' ? options.replace : options
        if (i18n.options.interpolation.defaultVariables) data = { ...i18n.options.interpolation.defaultVariables, ...data }
        res = run.interpolateHooks(res, data, options.lng || i18n.language, options)
      } else {
        res = newRes
      }

      const postProcess = options.postProcess || i18n.options.postProcess
      const postProcessorNames = typeof postProcess === 'string' ? [postProcess] : postProcess
      if (res !== undefined && postProcessorNames && postProcessorNames.length) {
        res = runSpecific.postProcessHooks(postProcessorNames, res, key, options)
      }

      return res
    },

    handleMissing (res, resExactUsedKey, key, ns, lng, options = {}) {
      if (res === undefined && lng !== undefined && ns !== undefined) {
        i18n.logger.warn(`No value found for key "${resExactUsedKey}" in namespace "${ns}" for language "${lng}"!`)

        // string, empty or null
        let usedDefault = false
        let usedKey = false

        // fallback value
        if (!this.isValidLookup(res) && options.defaultValue !== undefined) {
          usedDefault = true
          if (options[i18n.options.pluralOptionProperty] !== undefined) {
            let pluralKey = runSpecific.resolvePluralHooks(options[i18n.options.pluralOptionProperty], key, lng, options)
            pluralKey = pluralKey.replace(key, 'defaultValue')
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
          const fallbackLngs = run.fallbackCodesHooks(i18n.options.fallbackLng, lng)
          if (i18n.options.saveMissingTo === 'fallback' && fallbackLngs && fallbackLngs[0]) {
            for (let i = 0; i < fallbackLngs.length; i++) lngs.push(fallbackLngs[i])
          } else if (i18n.options.saveMissingTo === 'all') {
            lngs = run.resolveHierarchyHooks(lng)
          } else {
            lngs.push(lng)
          }

          if (i18n.options.saveMissing) {
            if (!i18n.isNamespaceLoaded(ns)) {
              i18n.logger.warn(
                `did not save key "${key}" as the namespace "${ns}" was not yet loaded`,
                'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the Promise to resolve before accessing it!!!'
              )
              return res
            }
            const send = async (l, k) => {
              if (updateMissing) {
                await runSpecific.handleUpdateKeyHooks(k, ns, l, res, options)
              } else {
                await runSpecific.handleMissingKeyHooks(k, ns, l, options.defaultValue || res, options)
              }
              i18n.emit('missingKey', l, ns, k, res)
            }

            const needsPluralHandling = options[i18n.options.pluralOptionProperty] !== undefined && typeof options[i18n.options.pluralOptionProperty] !== 'string'
            if (i18n.options.saveMissingPlurals && needsPluralHandling) {
              lngs.forEach((l) => {
                const plurals = runSpecific.formPluralsHooks(key, l, options)
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

      if (res !== undefined) {
        const handleAsObject = typeof res !== 'string' && typeof res !== 'boolean' && typeof res !== 'number'
        const keySeparator = options.keySeparator !== undefined ? options.keySeparator : i18n.options.keySeparator
        const joinArrays = options.joinArrays !== undefined ? options.joinArrays : i18n.options.joinArrays
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
                ...{ joinArrays: false, ns: namespaces }
              })
              if (copy[m] === deepKey) copy[m] = res[m] // if nothing found use orginal value as fallback
            }
          }
          res = copy
          if (resTypeIsArray && typeof joinArrays === 'string') {
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

const stack = {
  register: (i18n) => {
    const languageUtils = new LanguageUtils(i18n.options)
    const interpolator = new Interpolator(i18n.options.interpolation)

    const i18nextFormat = getI18nextFormat(i18n)

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
    i18n.addHook('interpolate', (value, data, lng, options) => interpolator.interpolate(value, data, lng, options))
  }
}

export default stack
