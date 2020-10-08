export function getDefaults () {
  return {
    debug: false,
    pluralOptionProperty: 'count',
    contextOptionProperty: 'context',
    defaultNS: 'translation',
    preload: [],
    pluralSeparator: '_',
    contextSeparator: '_',
    saveMissing: false, // enable to send missing values
    updateMissing: false, // enable to update default values if different from translated value (only useful on initial development, or when keeping code as source of truth)
    saveMissingTo: 'fallback', // 'current' || 'all'
    saveMissingPlurals: true // will save all forms not only singular key
  }
}
