# i18next: learn once - translate everywhere
## visit ➡️ [i18next.com](https://www.i18next.com)


```javascript
import i18next from 'i18next'

const i18n = i18next({ lng: 'en' })

i18n.addHook('extendOptions', async () => {
  const additionalOptions = await takeOptionsFromSomewhere()
  return additionalOptions
})
// or
i18n.addHook('extendOptions', () => {
  const someComputedValue = 2 + Math.random()
  return { special: someComputedValue }
})


i18n.addHook('loadResources', () => ({
  en: {
    translation: {
      'my.key': 'a value'
    }
  }
}))

i18n.addHook('resolvePlural', (count, key, lng, options) => `${key}_${count}`)

i18n.addHook('resolveKey', (key, ns, lng, res, options) => res[lng][ns][key])


i18n.on('initialized', (i18n) => {
  console.log('i18next has been initialized')
})

await i18n.init()

i18n.t('my.key') // a value
```

## Some differences:

- not a singleton anymore
- handles nested and flat resources automatically
- automatic detection when using natural language keys
- automatic detection when returning objects
- more customizable
- interpolation: automatic escaping of regex prefixes/suffixes
- interpolation: no nesting anymore
- Intl plural rules (cardinal and ordinal)
- offer resolvedLanguage to be used i.e. in a language switcher
- separate compatibility layer for plugins
- separate compatibility layer for old i18next behaviour (plurals and nesting)