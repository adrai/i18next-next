export const isIE10 =
  typeof window !== 'undefined' &&
  window.navigator &&
  window.navigator.userAgent &&
  window.navigator.userAgent.indexOf('MSIE') > -1

const chars = [' ', ',', '?', '!', ';']
export function looksLikeObjectPath (key, nsSeparator, keySeparator) {
  nsSeparator = nsSeparator || ''
  keySeparator = keySeparator || ''
  const possibleChars = chars.filter((c) => nsSeparator.indexOf(c) < 0 || keySeparator.indexOf(c) < 0)
  if (possibleChars.length === 0) return true
  const r = new RegExp(`(${possibleChars.map((c) => c === '?' ? '\\?' : c).join('|')})`)
  let matched = !r.test(key)
  if (!matched) {
    const ki = key.indexOf(keySeparator)
    if (ki > 0 && !r.test(key.substring(0, ki))) {
      matched = true
    }
  }
  return matched
}

export function deepFind (obj, path, keySeparator = '.') {
  if (!obj) return undefined
  if (obj[path]) return obj[path]
  const paths = path.split(keySeparator)
  let current = obj
  for (let i = 0; i < paths.length; ++i) {
    if (!current) return undefined
    if (typeof current[paths[i]] === 'string' && i + 1 < paths.length) {
      return undefined
    }
    if (current[paths[i]] === undefined) {
      let j = 2
      let p = paths.slice(i, i + j).join(keySeparator)
      let mix = current[p]
      while (mix === undefined && paths.length > i + j) {
        j++
        p = paths.slice(i, i + j).join(keySeparator)
        mix = current[p]
      }
      if (mix === undefined) return undefined
      if (mix === null) return null
      if (path.endsWith(p)) {
        if (typeof mix === 'string') return mix
        if (p && typeof mix[p] === 'string') return mix[p]
      }
      const joinedPath = paths.slice(i + j).join(keySeparator)
      if (joinedPath) return deepFind(mix, joinedPath, keySeparator)
      return undefined
    }
    current = current[paths[i]]
  }
  return current
}

export function deepExtend (target, source, overwrite) {
  for (const prop in source) {
    if (prop !== '__proto__' && prop !== 'constructor') {
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

export function wait (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
