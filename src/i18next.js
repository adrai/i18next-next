const hookNames = [
  'extendOptions',
  'loadResources',
  'resolvePlural'
]

const runHooks = async (hooks, args) => {
  return Promise.all(hooks.map((handle) => {
    const ret = handle(...args)
    return ret && ret.then ? ret : Promise.resolve(ret)
  }))
}

class I18next {
  constructor (options = {}) {
    this.isInitialized = false
    hookNames.forEach((name) => {
      this[`${name}Hooks`] = []
    })
    this.resources = {}

    this.options = options
  }

  throwIfAlreadyStarted (msg) {
    if (this.isInitialized) throw new Error(msg)
  }

  throwBecauseOfHookIfAlreadyStarted (hook) {
    this.throwIfAlreadyStarted(`Cannot call "addHook(${hook})" when fastify instance is already started!`)
  }

  async runExtendOptionsHooks () {
    const allOptions = await runHooks(this.extendOptionsHooks, [{ ...this.options }])
    allOptions.forEach((opt) => {
      this.options = { ...opt, ...this.options }
    })
  }

  async runLoadResourcesHooks () {
    let resources = {}
    const allResources = await runHooks(this.loadResourcesHooks, [])
    allResources.forEach((res) => {
      resources = { ...resources, ...res }
    })
    return resources
  }

  runResolvePluralHooks (key, options) {
    for (const hook of this.resolvePluralHooks) {
      const resolvedKey = hook(key, options)
      if (resolvedKey !== undefined) return resolvedKey
    }
  }

  /**
   * public api
   */

  addHook (name, hook) {
    this.throwBecauseOfHookIfAlreadyStarted(name)
    if (hookNames.indexOf(name) < 0) throw new Error(`${name} is not a valid hook!`)
    this[`${name}Hooks`].push(hook)
    return this
  }

  async init () {
    await this.runExtendOptionsHooks()
    this.resources = await this.runLoadResourcesHooks()
    this.isInitialized = true
    // TODO: emit initialized event
    return this
  }

  t (key, options = {}) {
    if (!this.isInitialized) throw new Error('i18next is not yet initialized!')
    if (options.count !== undefined) {
      const resolvedKey = this.runResolvePluralHooks(key, options)
      if (resolvedKey !== undefined) {
        if (!this.resources[resolvedKey]) {
          console.log(`There is no resolved plural key: ${resolvedKey}`)
          return undefined
        }
        return this.resources[resolvedKey]
      } else {
        // TODO: the default plural resolver
      }
    }
    return this.resources[key]
  }
}

export default function (options) {
  return new I18next(options)
}
