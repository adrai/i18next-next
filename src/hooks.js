export const hookNames = [
  'extendOptions',
  'loadResources',
  'resolvePlural',
  'translate',
  'formPlurals',
  'resolveContext',
  'resolveKey',
  'read',
  'handleMissingKey',
  'handleUpdateKey',
  'detectLanguage',
  'cacheLanguage',
  'bestMatchFromCodes',
  'fallbackCodes',
  'resolveHierarchy',
  'postProcess',
  'parseI18nFormat',
  'addI18nFormatLookupKeys',
  'interpolate'
]

export const runHooks = async (hooks, args) => {
  return Promise.all(hooks.map((handle) => {
    const ret = handle(...args)
    return ret && typeof ret.then === 'function' ? ret : Promise.resolve(ret)
  }))
}
