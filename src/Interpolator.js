import baseLogger from './logger.js'
import { deepFind } from './utils.js'
import { getDefaults } from './defaults.js'

// eslint-disable-next-line no-useless-escape
const regexEscape = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')

class Interpolator {
  constructor (options = {}) {
    this.logger = baseLogger.create('interpolator')
    this.options = { ...getDefaults().interpolation, ...options }
    if (options.defaultVariables) this.options.defaultVariables = options.defaultVariables
    this.escapeValue = this.options.escapeValue
    this.format = (this.options.format) || (value => value)
    this.formatSeparator = this.options.formatSeparator ? this.options.formatSeparator : this.options.formatSeparator || ','
    this.prefix = this.options.prefix
    this.suffix = this.options.suffix
    try {
      this.regexpStr = `${this.prefix}(.+?)${this.suffix}`
      this.regexp = new RegExp(this.regexpStr, 'g')
    } catch (e) {
      this.regexpStr = regexEscape(`${this.prefix}(.+?)${this.suffix}`)
      this.regexp = new RegExp(this.regexpStr, 'g')
    }
    this.unescapePrefix = this.options.unescapePrefix
    this.unescapeSuffix = this.options.unescapeSuffix
    try {
      this.unescapeRegexpStr = `${this.unescapePrefix}(.+?)${this.unescapeSuffix}`
      this.unescapeRegexp = new RegExp(this.unescapeRegexpStr, 'g')
    } catch (e) {
      this.unescapeRegexpStr = regexEscape(`${this.unescapePrefix}(.+?)${this.unescapeSuffix}`)
      this.unescapeRegexp = new RegExp(this.unescapeRegexpStr, 'g')
    }
    this.maxReplaces = this.options.maxReplaces ? this.options.maxReplaces : 1000
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

  interpolate (str, data = {}, lng, options = {}) {
    const escapeValue = options.interpolation && options.interpolation.escapeValue !== undefined ? options.interpolation.escapeValue : this.escapeValue
    const escapeFn = options.interpolation && options.interpolation.escape !== undefined ? options.interpolation.escape : this.options.escape
    const missingInterpolationHandler = (options && options.missingInterpolationHandler) || this.options.missingInterpolationHandler

    const defaultData = (this.options && this.options.defaultVariables) || {}
    Object.keys(data).forEach((k) => {
      if (data[k] === undefined) delete data[k]
    })
    const allData = { ...defaultData, ...data }
    this.regexp.lastIndex = 0
    let match = this.regexp.exec(str)
    let value
    let replaces = 0
    while (match) {
      let variable = match[1].trim()
      let skipEscape = false
      this.unescapeRegexp.lastIndex = 0
      if (this.unescapeRegexp.test(variable)) {
        variable = variable.substring(this.unescapePrefix.length, variable.length - this.unescapeSuffix.length).trim()
        skipEscape = true
      }
      value = this.handleFormat(variable, allData, lng, options)
      if (value === null) value = ''
      if (value === undefined) {
        if (typeof missingInterpolationHandler === 'function') {
          const temp = missingInterpolationHandler(str, match, options)
          value = typeof temp === 'string' ? temp : ''
        } else {
          this.logger.warn(`missed to pass in variable "${match[1]}" for interpolating "${str}"`)
          value = ''
        }
      }
      str = str.replace(match[0], escapeValue && !skipEscape ? escapeFn(value) : value)

      this.regexp.lastIndex = 0
      match = this.regexp.exec(str)
      replaces++
      if (replaces >= this.maxReplaces) break
    }
    return str
  }
}

export default Interpolator
