import Interpolator from '../../src/Interpolator.js'

function createClassOnDemand (ClassOrObject) {
  if (!ClassOrObject) return null
  if (typeof ClassOrObject === 'function') return new ClassOrObject()
  return ClassOrObject
}

export default function compatibilityLayer (m, opt = {}) {
  const module = createClassOnDemand(m)
  return { // opt are module specific options... not anymore passed as module options on global i18next options
    register: (i18n) => {
      // interpolator is mainly used for path interpolation, this interpolation function should be placed in the modules, in future...
      i18n.services.interpolator = new Interpolator(i18n.options.interpolation)

      i18n.services.utils.hasLoadedNamespace = i18n.services.utils.isNamespaceLoaded

      // modules, like react-i18next used the old callback signature
      const loadNamespaces = i18n.loadNamespaces.bind(i18n)
      i18n.loadNamespaces = (ns, clb) => {
        if (typeof clb !== 'function') return loadNamespaces(ns, clb)
        loadNamespaces(ns).then((ret) => clb(null, ret)).catch(clb)
      }
      const loadLanguages = i18n.loadLanguages.bind(i18n)
      i18n.loadLanguages = (lng, clb) => {
        if (typeof clb !== 'function') return loadLanguages(lng, clb)
        loadLanguages(lng).then((ret) => clb(null, ret)).catch(clb)
      }

      // i18n.services.languageDetector = {
      //   cacheLanguage: run(this).cacheLanguageHooks,
      //   detectLanguage:
      // }

      i18n.services.languageDetector = {
        detect: (...args) => {
          if (!i18n.detectLanguageHooks) return
          for (const hook of i18n.detectLanguageHooks) {
            const ret = hook.apply(this, args)
            if (ret && typeof ret.then === 'function') {
              const msg = `You are using an asynchronous detectLanguage hook (${i18n.detectLanguageHooks.indexOf(hook) + 1}. hook)`
              i18n.logger.error(msg, hook.toString())
              throw new Error(msg)
            }
            if (!ret) continue
            let lngs = ret
            if (lngs && typeof lngs !== 'string') lngs = lngs[0]
            if (lngs) return lngs
          }
        },
        cacheUserLanguage: (lng) => {
          i18n.services.languageDetector.cacheLanguage(lng)
        }
      }

      // modules, like i18next-http-middleware used the old sync signature
      i18n.cloneInstance = (options = {}) => {
        options.initImmediate = false
        const c = i18n.clone(options)
        const changeLanguage = c.changeLanguage.bind(c)
        c.changeLanguage = (lng) => {
          changeLanguage(lng)
          c.language = lng
        }
        return c
      }

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
          .addHook('detectLanguage', (...args) => {
            if (module.async) {
              return new Promise((resolve) => module.detect(...args, (lng) => resolve(lng)))
            } else {
              return module.detect(...args)
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
        module.init(i18n)
      }

      if (!i18n.services.backendConnector && i18n.readHooks && i18n.readHooks.length > 0) {
        i18n.services.backendConnector = {
          backend: true,
          get state () {
            const s = {}
            const data = i18n.store.getData()
            Object.keys(data).forEach((lng) => {
              Object.keys(data[lng]).forEach((ns) => {
                s[`${lng}|${ns}`] = 2
              })
            })
            const loading = this.loading || {}
            Object.keys(loading).forEach((lng) => {
              loading[lng].forEach((ns) => {
                s[`${lng}|${ns}`] = 1
              })
            })
            return s
          }
        }
      }
    }
  }
}
