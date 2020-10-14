export async function runHooks (hooks, args) {
  return Promise.all(hooks.map((handle) => {
    const ret = handle(...args)
    return ret && typeof ret.then === 'function' ? ret : Promise.resolve(ret)
  }))
}

export function runAsyncLater (hooks = [], args) {
  const immediateResults = []
  const asyncHandles = []
  hooks.forEach((handle) => {
    const ret = handle(...args)
    if (ret && typeof ret.then === 'function') {
      asyncHandles.push(ret)
    } else {
      immediateResults.push(ret)
    }
  })
  return { sync: immediateResults, async: asyncHandles }
}

export function run (instance) {
  return {
    async detectLanguage (...args) {
      if (!instance.hooks.detectLanguage) return
      for (const hook of instance.hooks.detectLanguage) {
        const ret = hook.apply(this, args)
        let lngs = await (ret && typeof ret.then === 'function' ? ret : Promise.resolve(ret))
        if (lngs && typeof lngs === 'string') lngs = [lngs]
        if (lngs) return lngs
      }
    },

    async cacheLanguage (lng) {
      if (!instance.hooks.cacheLanguage) return
      return runHooks(instance.hooks.cacheLanguage, [lng])
    },

    resolve (key, options) {
      if (!instance.hooks.resolve) return
      for (const hook of instance.hooks.resolve) {
        const resolved = hook(key, instance.store.getData(), options)
        if (resolved !== undefined) return resolved
      }
    },

    bestMatchFromCodes (lngs) {
      if (!instance.hooks.bestMatchFromCodes) return lngs[0]
      for (const hook of instance.hooks.bestMatchFromCodes) {
        const lng = hook(lngs)
        if (lng !== undefined) return lng
      }
      return lngs[0]
    },

    fallbackCodes (fallbackLng, lng) {
      if (!instance.hooks.fallbackCodes) return [fallbackLng]
      for (const hook of instance.hooks.fallbackCodes) {
        const fallbacks = hook(fallbackLng, lng)
        if (fallbacks !== undefined) return fallbacks
      }
      return [fallbackLng]
    },

    resolveHierarchy (lng, fallbackLng) {
      if (!instance.hooks.resolveHierarchy) return [lng]
      for (const hook of instance.hooks.resolveHierarchy) {
        const hir = hook(lng, fallbackLng)
        if (hir !== undefined) return hir
      }
      return [lng]
    },

    translated (res, keys, resolved, options = {}) {
      if (!instance.hooks.translated) return res
      for (const hook of instance.hooks.translated) {
        const translated = hook(res, keys, resolved, options)
        if (translated !== undefined) return translated
      }
      return res
    }
  }
}
