export const hookNames = [
  'extendOptions',
  'loadResources',
  'resolvePlural',
  'resolveContext',
  'translate',
  'read',
  'detectLanguage',
  'cacheLanguage',
  'bestMatchFromCodes',
  'fallbackCodes',
  'resolveHierarchy',
  'postProcess'
]

export const runHooks = async (hooks, args) => {
  return Promise.all(hooks.map((handle) => {
    const ret = handle(...args)
    return ret && ret.then ? ret : Promise.resolve(ret)
  }))
}
