const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;'
}

const escape = (data) => {
  if (typeof data === 'string') {
    return data.replace(/[&<>"'/]/g, s => entityMap[s])
  }
  return data
}

export function getDefaults () {
  return {
    debug: false,
    pluralOptionProperty: 'count',
    contextOptionProperty: 'context',
    defaultNS: 'translation',
    fallbackNS: false, // string or array of namespaces
    supportedLngs: false, // array with supported languages
    nonExplicitSupportedLngs: false,
    load: 'all', // | currentOnly | languageOnly
    preload: [], // array with preload languages
    keySeparator: '.',
    nsSeparator: ':',
    pluralSeparator: '_',
    contextSeparator: '_',
    saveMissing: false, // enable to send missing values
    updateMissing: false, // enable to update default values if different from translated value (only useful on initial development, or when keeping code as source of truth)
    saveMissingTo: 'fallback', // 'current' || 'all'
    saveMissingPlurals: true, // will save all forms not only singular key
    appendNamespaceToCIMode: false,
    returnNull: true, // allows null value as valid translation
    returnEmptyString: true, // allows empty string value as valid translation
    // overloadTranslationOptionHandler: (args) => {
    //   let ret = {}
    //   if (typeof args[1] === 'object') ret = args[1]
    //   if (typeof args[1] === 'string') ret.defaultValue = args[1]
    //   if (typeof args[2] === 'string') ret.tDescription = args[2]
    //   if (typeof args[2] === 'object' || typeof args[3] === 'object') {
    //     const options = args[3] || args[2]
    //     Object.keys(options).forEach((key) => {
    //       ret[key] = options[key]
    //     })
    //   }
    //   return ret
    // },
    interpolation: {
      format: (value, format, lng, options) => value,
      formatSeparator: ',',
      escapeValue: true,
      prefix: '{{',
      suffix: '}}',
      defaultVariables: {},
      escape
    }
  }
}
