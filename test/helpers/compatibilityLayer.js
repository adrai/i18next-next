function createClassOnDemand (ClassOrObject) {
  if (!ClassOrObject) return null
  if (typeof ClassOrObject === 'function') return new ClassOrObject()
  return ClassOrObject
}

export function compatibilityLayer (m, opt = {}) {
  const module = createClassOnDemand(m)
  return { // opt are module specific options... not anymore passed as module options on global i18next options
    register: (i18n) => {
      if (module.init) module.init(i18n.services, opt, i18n.options)
      if (module.type === 'backend') {
        const read = (lng, ns) => new Promise((resolve, reject) => module.read(lng, ns, (err, ret) => err ? reject(err) : resolve(ret)))
        i18n.addHook('read', async (toLoad) => {
          const toRead = []
          Object.keys(toLoad).forEach((lng) => {
            toLoad[lng].forEach((ns) => {
              toRead.push({ lng, ns })
            })
          })
          const res = await Promise.all(toRead.map(async (entry) => {
            const ret = await read(entry.lng, entry.ns)
            return { lng: entry.lng, ns: entry.ns, resources: ret }
          }))
          return res.reduce((prev, curr) => {
            prev[curr.lng] = prev[curr.lng] || {}
            prev[curr.lng][curr.ns] = curr.resources
            return prev
          }, {})
        })
      }
      if (module.type === 'languageDetector') {
        i18n
          .addHook('detectLanguage', () => {
            if (module.async) {
              return new Promise((resolve) => module.detect((lng) => resolve(lng)))
            } else {
              return module.detect()
            }
          })
          .addHook('cacheLanguage', (lng) => module.cacheUserLanguage(lng))
      }
      if (module.type === 'postProcessor') {
        i18n.addHook('postProcess', module.name, (value, key, opt) => module.process(value, key, opt, {
          // exists: // TODO
          translate: i18n.t.bind(i18n)
        }))
      }
    }
  }
}
