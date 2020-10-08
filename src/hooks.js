export const hookNames = [
  'extendOptions',
  'loadResources',
  'resolvePlural',
  'formPlurals',
  'resolveContext',
  'translate',
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
  'addI18nFormatLookupKeys'
]

export const runHooks = async (hooks, args) => {
  return Promise.all(hooks.map((handle) => {
    const ret = handle(...args)
    return ret && ret.then ? ret : Promise.resolve(ret)
  }))
}
