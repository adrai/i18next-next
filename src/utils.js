export const isIE10 =
  typeof window !== 'undefined' &&
  window.navigator &&
  window.navigator.userAgent &&
  window.navigator.userAgent.indexOf('MSIE') > -1

export function deepFind (obj, path, keySeparator = '.') {
  if (obj[path]) return obj[path]
  const paths = path.split(keySeparator)
  let current = obj
  for (let i = 0; i < paths.length; ++i) {
    if (current[paths[i]] === undefined) {
      return undefined
    } else {
      current = current[paths[i]]
    }
  }
  return current
}

export function deepExtend (target, source, overwrite) {
  for (const prop in source) {
    if (prop !== '__proto__') {
      if (prop in target) {
        // If we reached a leaf string in target or source then replace with source or skip depending on the 'overwrite' switch
        if (
          typeof target[prop] === 'string' ||
          target[prop] instanceof String ||
          typeof source[prop] === 'string' ||
          source[prop] instanceof String
        ) {
          if (overwrite) target[prop] = source[prop]
        } else {
          deepExtend(target[prop], source[prop], overwrite)
        }
      } else {
        target[prop] = source[prop]
      }
    }
  }
  return target
}
