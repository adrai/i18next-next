# i18next: learn once - translate everywhere
## visit ➡️ [i18next.com](https://www.i18next.com)


```javascript
import i18next from 'i18next'

const i18n = i18next({ some: 'options' })

i18n.addHook('extendOptions', async () => {
  const additionalOptions = await takeOptionsFromSomewhere()
  return additionalOptions
})
// or
i18n.addHook('extendOptions', () => {
  const someComputedValue = 2 + Math.random()
  return { special: someComputedValue }
})


i18n.addHook('loadResources', () => ({ 'my.key': 'a value' }))

i18n.addHook('resolvePlural', (key, count, options) => `${key}_${options.count}`)

i18n.addHook('translate', (key, res, options) => res[key])


i18n.on('initialized', (i18n) => {
  console.log('i18next has been initialized')
})

await i18n.init()

i18n.t('my.key') // a value
```