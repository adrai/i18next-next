export function getDefaults () {
  return {
    // core options
    debug: false,
    initImmediate: true,
    ns: ['translation'],
    defaultNS: 'translation',
    fallbackLng: ['dev'],
    preload: [], // array with preload languages
    keySeparator: '.',
    nsSeparator: ':',
    appendNamespaceToCIMode: false,
    overloadTranslationOptionHandler: (args) => {
      let ret = {}
      if (typeof args[1] === 'object') ret = args[1]
      if (typeof args[1] === 'string') ret.defaultValue = args[1]
      if (typeof args[2] === 'string') ret.tDescription = args[2]
      if (typeof args[2] === 'object' || typeof args[3] === 'object') {
        const options = args[3] || args[2]
        Object.keys(options).forEach((key) => {
          ret[key] = options[key]
        })
      }
      return ret
    }
    // additional default options can be added via addHook('extendOptions'), like in default stack
  }
}
