export const hookNames = [
  'extendOptions',
  'loadResources',
  'resolvePlural',
  'translate',
  'read',
  'detectLanguage',
  'cacheLanguage'
]

export const runHooks = async (hooks, args) => {
  return Promise.all(hooks.map((handle) => {
    const ret = handle(...args)
    return ret && ret.then ? ret : Promise.resolve(ret)
  }))
}
