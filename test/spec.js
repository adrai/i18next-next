import i18next from '../index.js'
import should from 'should'

describe('i18next', () => {
  it('basic addHook stuff', async () => {
    const i18nextInstance = i18next({ some: 'options' })
    i18nextInstance.addHook('extendOptions', () => {
      return { add: 'this' }
    })
    i18nextInstance.addHook('extendOptions', () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ another: 'thing' }), 200)
      })
    })
    i18nextInstance.addHook('loadResources', () => ({ 'a key': 'a value' }))
    await i18nextInstance.init()
    should(i18nextInstance.options).have.properties({
      some: 'options',
      add: 'this',
      another: 'thing'
    })
    const translated = i18nextInstance.t('a key')
    should(translated).eql('a value')
  })

  it('custom plural resolver', async () => {
    const i18nextInstance = i18next()
    i18nextInstance.addHook('loadResources', () => ({ key: 'a value', key_3: '3 values', '8_key': 'values from other resolver' }))
    i18nextInstance.addHook('resolvePlural', (key, options) => {
      if (options.count < 4) return `${key}_${options.count}`
    })
    i18nextInstance.addHook('resolvePlural', (key, options) => `${options.count * 2}_${key}`)
    await i18nextInstance.init()
    let translated = i18nextInstance.t('key', { count: 3 })
    should(translated).eql('3 values')
    translated = i18nextInstance.t('key', { count: 4 })
    should(translated).eql('values from other resolver')
  })
})
