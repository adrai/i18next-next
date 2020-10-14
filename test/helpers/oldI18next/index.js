import PluralResolver from './PluralResolver.js'
import LanguageUtils from './LanguageUtils.js'
import Interpolator from './Interpolator.js'

const defaultOptions = {
  simplifyPluralSuffix: true,
  interpolation: {
    // prefixEscaped: '{{',
    // suffixEscaped: '}}',
    // unescapeSuffix: '',
    unescapePrefix: '-',
    nestingPrefix: '$t(',
    nestingSuffix: ')',
    nestingOptionsSeparator: ',',
    // nestingPrefixEscaped: '$t(',
    // nestingSuffixEscaped: ')',,
    skipOnVariables: false
  }
}

export default {
  register: (i18n) => {
    let pr
    let inter
    i18n.addHook('extendOptions', (opt) => ({ ...defaultOptions, ...opt }))
    i18n.addHook('initializing', (options) => {
      pr = new PluralResolver(i18n.logger, new LanguageUtils(options), options)
      inter = new Interpolator(i18n.logger, options)
    })
    i18n.addHook('resolvePlural', (count, key, lng, options) => `${key}${i18n.options.pluralSeparator}${pr.getSuffix(lng, count)}`)
    i18n.addHook('formPlurals', (key, lng, options) => pr.getPluralFormsOfKey(lng, key))
    i18n.addHook('interpolate', (key, value, data, lng, options) => {
      // i18next.parsing
      if (options.interpolation) {
        inter.init({
          ...options,
          ...{ interpolation: { ...i18n.options.interpolation, ...options.interpolation } }
        })
      }
      const skipOnVariables =
        (options.interpolation && options.interpolation.skipOnVariables) ||
        i18n.options.interpolation.skipOnVariables
      let nestBef
      if (skipOnVariables) {
        const nb = value.match(inter.nestingRegexp)
        // has nesting aftbeforeer interpolation
        nestBef = nb && nb.length
      }

      // interpolate
      value = inter.interpolate(value, data, lng, options)

      // nesting
      if (skipOnVariables) {
        const na = value.match(inter.nestingRegexp)
        // has nesting after interpolation
        const nestAft = na && na.length
        if (nestBef < nestAft) options.nest = false
      }
      if (options.nest !== false) {
        value = inter.nest(
          value,
          (...args) => {
            const a = [...args]
            let optKey = key
            if (typeof optKey !== 'object' && i18n.options.overloadTranslationOptionHandler) {
              /* eslint prefer-rest-params: 0 */
              optKey = i18n.options.overloadTranslationOptionHandler([...args, optKey])
            }
            // if (lastKey && lastKey[0] === args[0] && !options.context) {
            //   i18n.logger.warn(`It seems you are nesting recursively key: ${args[0]} in key: ${key[0]}`)
            //   return null
            // }
            return i18n.t(a[0], optKey)
          },
          options
        )
      }

      if (options.interpolation) inter.reset()

      return value
    })
  }
}
