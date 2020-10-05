import i18next from '../index.js'
import should from 'should'

describe('i18next', () => {
  it('onExtendOptions', async () => {
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
})
