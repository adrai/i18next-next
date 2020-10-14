const throwIf = {
  alreadyInitialized: (instance) => (msg, onlyLog) => {
    if (instance.isInitialized) {
      if (onlyLog) {
        instance.logger.error(msg)
      } else {
        throw new Error(msg)
      }
    }
  },

  alreadyInitializedFn: (instance) => (fn, onlyLog) => {
    throwIf.alreadyInitialized(instance)(`Cannot call "${fn}" function when i18next instance is already initialized!`, onlyLog)
  },

  notInitialized: (instance) => (msg, onlyLog) => {
    if (!instance.isInitialized) {
      if (onlyLog) {
        instance.logger.error(msg)
      } else {
        throw new Error(msg)
      }
    }
  },

  notInitializedFn: (instance) => (fn, onlyLog) => {
    throwIf.notInitialized(instance)(`Cannot call "${fn}" function when i18next instance is not yet initialized!`, onlyLog)
  }
}

export default throwIf
