export async function runHooks (hooks, args) {
  return Promise.all(hooks.map((handle) => {
    const ret = handle(...args)
    return ret && typeof ret.then === 'function' ? ret : Promise.resolve(ret)
  }))
}

export function run (instance) {
  return {
    async extendOptionsHooks () {
      if (!instance.extendOptionsHooks) return instance.options
      const allOptions = await runHooks(instance.extendOptionsHooks, [{ ...instance.options }])
      allOptions.forEach((opt) => {
        instance.options = { ...opt, ...instance.options }
      })
    },

    async loadResourcesHooks () {
      if (!instance.loadResourcesHooks) return
      const allResources = await runHooks(instance.loadResourcesHooks, [instance.options])
      return allResources.reduce((prev, curr) => ({ ...prev, ...curr }), {})
    },

    async detectLanguageHooks () {
      if (!instance.detectLanguageHooks) return
      for (const hook of instance.detectLanguageHooks) {
        const ret = hook()
        let lngs = await (ret && typeof ret.then === 'function' ? ret : Promise.resolve(ret))
        if (lngs && typeof lngs === 'string') lngs = [lngs]
        if (lngs) return lngs
      }
    },

    async cacheLanguageHooks (lng) {
      if (!instance.cacheLanguageHooks) return
      return runHooks(instance.cacheLanguageHooks, [lng])
    },

    resolveHooks (key, options) {
      if (!instance.resolveHooks) return
      for (const hook of instance.resolveHooks) {
        const resolved = hook(key, instance.store.getData(), options)
        if (resolved !== undefined) return resolved
      }
    },

    bestMatchFromCodesHooks (lngs) {
      if (!instance.bestMatchFromCodesHooks) return
      for (const hook of instance.bestMatchFromCodesHooks) {
        const lng = hook(lngs)
        if (lng !== undefined) return lng
      }
    },

    fallbackCodesHooks (fallbackLng, lng) {
      if (!instance.fallbackCodesHooks) return
      for (const hook of instance.fallbackCodesHooks) {
        const fallbacks = hook(fallbackLng, lng)
        if (fallbacks !== undefined) return fallbacks
      }
    },

    resolveHierarchyHooks (lng, fallbackLng) {
      if (!instance.resolveHierarchyHooks) return [lng]
      for (const hook of instance.resolveHierarchyHooks) {
        const hir = hook(lng, fallbackLng)
        if (hir !== undefined) return hir
      }
      return [lng]
    },

    interpolateHooks (res, data, lng, options) {
      if (!instance.interpolateHooks) return res
      for (const hook of instance.interpolateHooks) {
        const interpolated = hook(res, data, lng, options)
        if (interpolated !== undefined && interpolated !== res) return interpolated
      }
      return res
    },

    translatedHooks (res, keys, resolved, options = {}) {
      if (!instance.translatedHooks) return res
      for (const hook of instance.translatedHooks) {
        const translated = hook(res, keys, resolved, options)
        if (translated !== undefined) return translated
      }
      return res
    }
  }
}
