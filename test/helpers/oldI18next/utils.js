export function makeString (object) {
  if (object == null) return ''
  /* eslint prefer-template: 0 */
  return '' + object
}

function getLastOfPath (object, path, Empty) {
  function cleanKey (key) {
    return key && key.indexOf('###') > -1 ? key.replace(/###/g, '.') : key
  }

  function canNotTraverseDeeper () {
    return !object || typeof object === 'string'
  }

  const stack = typeof path !== 'string' ? [].concat(path) : path.split('.')
  while (stack.length > 1) {
    if (canNotTraverseDeeper()) return {}

    const key = cleanKey(stack.shift())
    if (!object[key] && Empty) object[key] = new Empty()
    object = object[key]
  }

  if (canNotTraverseDeeper()) return {}
  return {
    obj: object,
    k: cleanKey(stack.shift())
  }
}

export function getPath (object, path) {
  const { obj, k } = getLastOfPath(object, path)

  if (!obj) return undefined
  return obj[k]
}

export function getPathWithDefaults (data, defaultData, key) {
  const value = getPath(data, key)
  if (value !== undefined) {
    return value
  }
  // Fallback to default values
  return getPath(defaultData, key)
}

export function regexEscape (str) {
  /* eslint no-useless-escape: 0 */
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
}

/* eslint-disable */
var _entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
}
/* eslint-enable */

export function escape (data) {
  if (typeof data === 'string') {
    return data.replace(/[&<>"'\/]/g, s => _entityMap[s])
  }
  return data
}
