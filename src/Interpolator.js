import baseLogger from './logger.js'
import { deepFind } from './utils.js'

class Interpolator {
  constructor (options = {}) {
    this.logger = baseLogger.create('interpolator')
    this.options = options
    this.format = (this.options.format) || (value => value)
    this.formatSeparator = this.options.formatSeparator ? this.options.formatSeparator : this.options.formatSeparator || ','

    this.resetRegExp()
  }

  resetRegExp () {
    const regexpStr = `${this.options.prefix}(.+?)${this.options.suffix}`
    this.regexp = new RegExp(regexpStr, 'g')
  }

  handleFormat (key, data, lng, options) {
    if (key.indexOf(this.formatSeparator) < 0) {
      const value = deepFind(data, key)
      return this.format(value, undefined, lng, options)
    }

    const p = key.split(this.formatSeparator)
    const k = p.shift().trim()
    const f = p.join(this.formatSeparator).trim()

    return this.format(deepFind(data, k), f, lng, options)
  }

  interpolate (str, data, lng, options = {}) {
    const escapeValue = options.interpolation && options.interpolation.escapeValue !== undefined ? options.interpolation.escapeValue : this.options.escapeValue
    const escapeFn = options.interpolation && options.interpolation.escape !== undefined ? options.interpolation.escape : this.options.escape

    const defaultData = (this.options && this.options && this.options.defaultVariables) || {}
    const allData = { ...defaultData, ...data }
    this.resetRegExp()
    let match = this.regexp.exec(str)
    let value
    while (match) {
      const variable = match[1].trim()
      value = this.handleFormat(variable, allData, lng, options)
      if (value === undefined) {
        this.logger.warn(`missed to pass in variable ${match[1]} for interpolating ${str}`)
        value = ''
      }
      str = str.replace(match[0], escapeValue ? escapeFn(value) : value)

      this.resetRegExp()
      match = this.regexp.exec(str)
    }
    return str
  }
}

export default Interpolator
