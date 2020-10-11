function createClassOnDemand (ClassOrObject) {
  if (!ClassOrObject) return null
  if (typeof ClassOrObject === 'function') return new ClassOrObject()
  return ClassOrObject
}

export default function compatibilityLayer (m, opt = {}) {
  const module = createClassOnDemand(m)
  return { // opt are module specific options... not anymore passed as module options on global i18next options
    register: (i18n) => {
      i18n.services.utils.hasLoadedNamespace = i18n.services.utils.isNamespaceLoaded
      if (module.init && module.type !== '3rdParty') module.init(i18n.services, opt, i18n.options)
      if (module.type === 'backend') {
        if (i18n.options.initImmediate === false) {
          i18n.addHook('read', (toLoad) => {
            const toRead = []
            Object.keys(toLoad).forEach((lng) => {
              toLoad[lng].forEach((ns) => {
                toRead.push({ lng, ns })
              })
            })
            const res = toRead.map((entry) => {
              let read
              module.read(entry.lng, entry.ns, (err, ret) => {
                if (err) {
                  if (typeof err === 'string') err = new Error(err)
                  err.retry = ret
                  throw err
                }
                read = ret
              })
              return { lng: entry.lng, ns: entry.ns, resources: read }
            })
            return res.reduce((prev, curr) => {
              prev[curr.lng] = prev[curr.lng] || {}
              prev[curr.lng][curr.ns] = curr.resources
              return prev
            }, {})
          })
        } else {
          const read = (lng, ns) => new Promise((resolve, reject) => module.read(lng, ns, (err, ret) => {
            if (err) {
              if (typeof err === 'string') err = new Error(err)
              err.retry = ret
            }
            return err ? reject(err) : resolve(ret)
          }))
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
        if (module.create) {
          i18n.addHook('handleMissingKey', async (key, ns, lng, value, options) => new Promise((resolve, reject) => module.create(lng, ns, key, value, (err) => err ? reject(err) : resolve(), options)))
          if (module.create.length === 6) i18n.addHook('handleUpdateKey', async (key, ns, lng, value, options) => new Promise((resolve, reject) => module.create(lng, ns, key, value, (err) => err ? reject(err) : resolve(), options, true)))
        }
        if (module.update) i18n.addHook('handleUpdateKey', async (key, ns, lng, value, options) => new Promise((resolve, reject) => module.create(lng, ns, key, value, (err) => err ? reject(err) : resolve(), options)))
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
          exists: i18n.exists.bind(i18n),
          translate: i18n.t.bind(i18n)
        }))
      }
      if (module.type === 'i18nFormat') {
        if (module.parse) i18n.addHook('parseI18nFormat', (res, options, lng, ns, key, info) => module.parse(res, options, lng, ns, key, info))
        if (module.addLookupKeys) i18n.addHook('addI18nFormatLookupKeys', (finalKeys, key, code, ns, options) => module.addLookupKeys(finalKeys, key, code, ns, options))
        if (module.getResource) i18n.addHook('resolveKey', (key, ns, lng, res, options) => module.getResource(lng, ns, key, options))
      }
      if (module.type === '3rdParty') {
        i18n.on('initialized', () => module.init(i18n))
      }
    }
  }
}
