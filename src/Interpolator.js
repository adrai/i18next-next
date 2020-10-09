import baseLogger from './logger.js'
import { flatten } from './utils.js'

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

class Interpolator {
  constructor (options = {}) {
    this.logger = baseLogger.create('interpolator')
    this.options = options

    this.resetRegExp()
  }

  resetRegExp () {
    const regexpStr = `${this.options.prefix}(.+?)${this.options.suffix}`
    this.regexp = new RegExp(regexpStr, 'g')
  }

  interpolate (str, data, options = {}) {
    this.resetRegExp()

    const escapeValue = options.interpolation && options.interpolation.escapeValue !== undefined ? options.interpolation.escapeValue : this.options.escapeValue
    const escapeFn = options.interpolation && options.interpolation.escape !== undefined ? options.interpolation.escape : (this.options.escape || escape)

    const defaultData = (this.options && this.options && this.options.defaultVariables) || {}
    const flatData = flatten({ ...defaultData, ...data })
    let match, value
    while ((match = this.regexp.exec(str))) {
      const variable = match[1].trim()
      value = flatData[variable]
      if (value === undefined) {
        this.logger.warn(`missed to pass in variable ${match[1]} for interpolating ${str}`)
        value = ''
      }
      str = str.replace(match[0], escapeValue ? escapeFn(value) : value)
    }
    return str
  }
}

export default Interpolator
