const throwIf = {
  alreadyInitialized: (instance) => (msg) => {
    if (instance.isInitialized) throw new Error(msg)
  },

  alreadyInitializedFn: (instance) => (fn) => {
    throwIf.alreadyInitialized(instance)(`Cannot call "${fn}" function when i18next instance is already initialized!`)
  },

  notInitialized: (instance) => (msg) => {
    if (!instance.isInitialized) throw new Error(msg)
  },

  notInitializedFn: (instance) => (fn) => {
    throwIf.notInitialized(instance)(`Cannot call "${fn}" function when i18next instance is not yet initialized!`)
  }
}

export default throwIf
