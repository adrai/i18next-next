import { runHooks } from './hooks.js'

const internalApi = {
  runExtendOptionsHooks: (instance) => async () => {
    const allOptions = await runHooks(instance.extendOptionsHooks, [{ ...instance.options }])
    allOptions.forEach((opt) => {
      instance.options = { ...opt, ...instance.options }
    })
  },

  runLoadResourcesHooks: (instance) => async () => {
    const allResources = await runHooks(instance.loadResourcesHooks, [instance.options])
    return allResources.reduce((prev, curr) => ({ ...prev, ...curr }), {})
  },

  runDetectLanguageHooks: (instance) => async () => {
    for (const hook of instance.detectLanguageHooks) {
      const ret = hook()
      let lngs = await (ret && typeof ret.then === 'function' ? ret : Promise.resolve(ret))
      if (lngs && typeof lngs === 'string') lngs = [lngs]
      if (lngs) return lngs
    }
  },

  runCacheLanguageHooks: (instance) => async (lng) => {
    return runHooks(instance.cacheLanguageHooks, [lng])
  },

  runHandleMissingKeyHooks: (instance) => async (key, ns, lng, value, options) => {
    return runHooks(instance.handleMissingKeyHooks, [key, ns, lng, value, options])
  },

  runHandleUpdateKeyHooks: (instance) => async (key, ns, lng, value, options) => {
    return runHooks(instance.handleUpdateKeyHooks, [key, ns, lng, value, options])
  },

  runResolvePluralHooks: (instance) => (count, key, lng, options) => {
    for (const hook of instance.resolvePluralHooks) {
      const resolvedKey = hook(count, key, lng, options)
      if (resolvedKey !== undefined) return resolvedKey
    }
  },

  runFormPluralsHooks: (instance) => (key, lng, options) => {
    for (const hook of instance.formPluralsHooks) {
      const resolvedKeys = hook(key, lng, options)
      if (resolvedKeys !== undefined && resolvedKeys.length) return resolvedKeys
    }
  },

  runResolveContextHooks: (instance) => (context, key, options) => {
    for (const hook of instance.resolveContextHooks) {
      const resolvedKey = hook(context, key, options)
      if (resolvedKey !== undefined) return resolvedKey
    }
  },

  runResolveHooks: (instance) => (key, options) => {
    for (const hook of instance.resolveHooks) {
      const resolved = hook(key, options)
      if (resolved !== undefined) return resolved
    }
  },

  runResolveKeyHooks: (instance) => (key, ns, lng, options) => {
    for (const hook of instance.resolveKeyHooks) {
      const resolvedValue = hook(key, ns, lng, instance.store.getData(), options)
      if (resolvedValue !== undefined) return resolvedValue
    }
  },

  runBestMatchFromCodesHooks: (instance) => (lngs) => {
    for (const hook of instance.bestMatchFromCodesHooks) {
      const lng = hook(lngs)
      if (lng !== undefined) return lng
    }
  },

  runFallbackCodesHooks: (instance) => (fallbackLng, lng) => {
    for (const hook of instance.fallbackCodesHooks) {
      const fallbacks = hook(fallbackLng, lng)
      if (fallbacks !== undefined) return fallbacks
    }
  },

  runResolveHierarchyHooks: (instance) => (lng, fallbackLng) => {
    for (const hook of instance.resolveHierarchyHooks) {
      const hir = hook(lng, fallbackLng)
      if (hir !== undefined) return hir
    }
  },

  runPostProcessHooks: (instance) => (postProcessorNames, value, key, opt) => {
    postProcessorNames.forEach((n) => {
      if (instance.postProcessHooks[n]) {
        value = instance.postProcessHooks[n](value, key, opt)
      } else {
        instance.logger.warn(`No post processor found with name ${n}`)
      }
    })
    return value
  },

  runParseI18nFormatHooks: (instance) => (res, options, lng, ns, key, info) => {
    for (const hook of instance.parseI18nFormatHooks) {
      const parsed = hook(res, options, lng, ns, key, info)
      if (parsed !== undefined) return parsed
    }
    return res
  },

  runAddI18nFormatLookupKeysHooks: (instance) => (finalKeys, key, code, ns, options) => {
    instance.addI18nFormatLookupKeysHooks.forEach((hook) => hook(finalKeys, key, code, ns, options))
  },

  runInterpolateHooks: (instance) => (res, data, lng, options) => {
    for (const hook of instance.interpolateHooks) {
      const interpolated = hook(res, data, lng, options)
      if (interpolated !== undefined && interpolated !== res) return interpolated
    }
    return res
  },

  runTranslateHooks: (instance) => (key, ns, lng, options = {}) => {
    for (const hook of instance.translateHooks) {
      const translated = hook(key, ns, lng, options)
      if (translated !== undefined) return translated
    }
    return undefined
  },

  isValidLookup: (instance) => (res) => {
    return (
      res !== undefined &&
      !(!instance.options.returnNull && res === null) &&
      !(!instance.options.returnEmptyString && res === '')
    )
  },

  extractFromKey: (instance) => (key, options = {}) => {
    const nsSeparator = options.nsSeparator !== undefined ? options.nsSeparator : instance.options.nsSeparator
    const keySeparator = options.keySeparator !== undefined ? options.keySeparator : instance.options.keySeparator

    let namespaces = options.ns || instance.options.defaultNS
    if (nsSeparator && key.indexOf(nsSeparator) > -1 && keySeparator) {
      const parts = key.split(nsSeparator)
      if (nsSeparator !== keySeparator || (nsSeparator === keySeparator && instance.options.ns && instance.options.ns.indexOf(parts[0]) > -1)) {
        namespaces = parts.shift()
      }
      key = parts.join(keySeparator)
    }
    if (typeof namespaces === 'string') namespaces = [namespaces]
    return { key, namespaces }
  },

  resolve: (instance) => (keys, options = {}) => {
    if (typeof keys === 'string') keys = [keys]
    let found, usedKey, exactUsedKey, usedLng, usedNS

    // forEach possible key
    keys.forEach((k) => {
      if (internalApi.isValidLookup(instance)(found)) return

      const extracted = internalApi.extractFromKey(instance)(k, options)
      const key = extracted.key
      usedKey = key
      let namespaces = extracted.namespaces
      if (instance.options.fallbackNS) namespaces = namespaces.concat(instance.options.fallbackNS)

      const codes = internalApi.runResolveHierarchyHooks(instance)(options.lng, options.fallbackLng)

      namespaces.forEach(ns => {
        if (internalApi.isValidLookup(instance)(found)) return

        usedNS = ns

        if (!instance.isNamespaceLoaded(usedNS)) {
          instance.logger.warn(
            `key "${usedKey}" for languages "${codes.join(
              ', '
            )}" won't get resolved as namespace "${usedNS}" was not yet loaded`,
            'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!'
          )
        }

        codes.forEach((code) => {
          if (internalApi.isValidLookup(instance)(found)) return
          usedLng = code

          const finalKeys = [key]
          exactUsedKey = finalKeys[finalKeys.length - 1]

          internalApi.runAddI18nFormatLookupKeysHooks(instance)(finalKeys, key, code, ns, options)

          if (options[instance.options.pluralOptionProperty] !== undefined) {
            const resolvedKey = internalApi.runResolvePluralHooks(instance)(options[instance.options.pluralOptionProperty], key, code, options)
            finalKeys.push(resolvedKey)
          }

          if (options[instance.options.contextOptionProperty] !== undefined) {
            const resolvedKey = internalApi.runResolveContextHooks(instance)(options[instance.options.contextOptionProperty], key, options)
            finalKeys.push(resolvedKey)
          }

          // iterate over finalKeys starting with most specific pluralkey (-> contextkey only) -> singularkey only
          let possibleKey
          while ((possibleKey = finalKeys.pop()) && !internalApi.isValidLookup(instance)(found)) {
            exactUsedKey = possibleKey
            found = internalApi.runResolveKeyHooks(instance)(possibleKey, ns, code, options)
          }
        })
      })
    })

    if (found === undefined) return
    return { res: found, usedKey, exactUsedKey, usedLng, usedNS }
  },

  extendTranslation: (instance) => (res, key, resolved, options = {}) => {
    if (res === undefined) return res

    const newRes = internalApi.runParseI18nFormatHooks(instance)(
      res,
      options,
      resolved.usedLng,
      resolved.usedNS,
      resolved.usedKey,
      { resolved }
    )

    if (res === newRes && !options.skipInterpolation) {
      let data = options.replace && typeof options.replace !== 'string' ? options.replace : options
      if (instance.options.interpolation.defaultVariables) data = { ...instance.options.interpolation.defaultVariables, ...data }
      res = internalApi.runInterpolateHooks(instance)(res, data, options.lng || instance.language, options)
    } else {
      res = newRes
    }

    const postProcess = options.postProcess || instance.options.postProcess
    const postProcessorNames = typeof postProcess === 'string' ? [postProcess] : postProcess
    if (res !== undefined && postProcessorNames && postProcessorNames.length) {
      res = internalApi.runPostProcessHooks(instance)(postProcessorNames, res, key, options)
    }

    return res
  },

  handleMissing: (instance) => (res, resExactUsedKey, key, ns, lng, options = {}) => {
    if (res === undefined) {
      instance.logger.warn(`No value found for key ${resExactUsedKey} in namespace ${ns} for language ${lng}!`)

      // string, empty or null
      let usedDefault = false
      let usedKey = false

      // fallback value
      if (!internalApi.isValidLookup(instance)(res) && options.defaultValue !== undefined) {
        usedDefault = true
        if (!res) res = options.defaultValue
      }

      if (!internalApi.isValidLookup(instance)(res)) {
        usedKey = true
        res = key
      }

      // save missing
      const updateMissing = options.defaultValue && options.defaultValue !== res && instance.options.updateMissing
      if (usedKey || usedDefault || updateMissing) {
        instance.logger.log(
          updateMissing ? 'updateKey' : 'missingKey',
          lng,
          ns,
          key,
          updateMissing ? options.defaultValue : res
        )

        let lngs = []
        const fallbackLngs = internalApi.runFallbackCodesHooks(instance)(instance.options.fallbackLng, lng)
        if (instance.options.saveMissingTo === 'fallback' && fallbackLngs && fallbackLngs[0]) {
          for (let i = 0; i < fallbackLngs.length; i++) lngs.push(fallbackLngs[i])
        } else if (instance.options.saveMissingTo === 'all') {
          lngs = internalApi.runResolveHierarchyHooks(instance)(lng)
        } else {
          lngs.push(lng)
        }

        if (instance.options.saveMissing) {
          if (!instance.isNamespaceLoaded(ns)) {
            instance.logger.warn(
              `did not save key "${key}" as the namespace "${ns}" was not yet loaded`,
              'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the Promise to resolve before accessing it!!!'
            )
            return
          }
          const send = async (l, k) => {
            if (updateMissing) {
              await internalApi.runHandleUpdateKeyHooks(instance)(k, ns, l, res, options)
            } else {
              await internalApi.runHandleMissingKeyHooks(instance)(k, ns, l, options.defaultValue, options)
            }
            instance.emit('missingKey', l, ns, k, res)
          }

          const needsPluralHandling = options[instance.options.pluralOptionProperty] !== undefined && typeof options[instance.options.pluralOptionProperty] !== 'string'
          if (instance.options.saveMissingPlurals && needsPluralHandling) {
            lngs.forEach((l) => {
              const plurals = internalApi.runFormPluralsHooks(instance)(key, l, options)
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

  translate: (instance) => (keys, ns, lng, options) => {
    // non valid keys handling
    if (keys === undefined || keys === null) return ''

    // get namespace(s)
    const { key, namespaces } = internalApi.extractFromKey(instance)(typeof keys === 'string' ? keys : keys[keys.length - 1], options)
    const namespace = namespaces[namespaces.length - 1]

    // return key on CIMode
    const appendNamespaceToCIMode = options.appendNamespaceToCIMode || instance.options.appendNamespaceToCIMode
    if (lng && lng.toLowerCase() === 'cimode') {
      const nsSeparator = options.nsSeparator || instance.options.nsSeparator
      if (appendNamespaceToCIMode && nsSeparator) {
        return namespace + nsSeparator + key
      }
      return key
    }

    // resolve
    let resolved = internalApi.runResolveHooks(instance)(keys, options)
    if (typeof resolved !== 'object') resolved = { res: resolved, usedKey: key, exactUsedKey: key, usedLng: lng }
    let res = resolved && resolved.res
    const resUsedKey = (resolved && resolved.usedKey) || key
    const resExactUsedKey = (resolved && resolved.exactUsedKey) || key

    if (res !== undefined) {
      const handleAsObject = typeof res !== 'string' && typeof res !== 'boolean' && typeof res !== 'number'
      const keySeparator = options.keySeparator !== undefined ? options.keySeparator : instance.options.keySeparator
      if (handleAsObject && keySeparator) {
        const resType = Object.prototype.toString.apply(res)
        const resTypeIsArray = resType === '[object Array]'
        const copy = resTypeIsArray ? [] : {} // apply child translation on a copy
        const newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey
        for (const m in res) {
          if (Object.prototype.hasOwnProperty.call(res, m)) {
            const deepKey = `${newKeyToUse}${keySeparator}${m}`
            copy[m] = instance.t(deepKey, {
              ...options,
              ...{ joinArrays: false, namespace }
            })
            if (copy[m] === deepKey) copy[m] = res[m] // if nothing found use orginal value as fallback
          }
        }
        res = copy
      }
    }

    // handle missing
    res = internalApi.handleMissing(instance)(res, resExactUsedKey, key, namespace, lng, options)

    // extend
    res = internalApi.extendTranslation(instance)(res, keys, resolved, options)

    return res
  }
}

export default internalApi
