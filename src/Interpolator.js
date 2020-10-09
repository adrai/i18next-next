import baseLogger from './logger.js'
import { deepFind } from './utils.js'

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
    const escapeFn = options.interpolation && options.interpolation.escape !== undefined ? options.interpolation.escape : this.options.escape

    const defaultData = this.options && this.options && this.options.defaultVariables
    const allData = { ...defaultData, ...data }
    let match, value
    while ((match = this.regexp.exec(str))) {
      const variable = match[1].trim()
      value = deepFind(allData, variable)
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
