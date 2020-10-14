import { getDefaults } from '../src/defaults.js'
import { extendOptions } from '../src/defaultStack.js'
import should from 'should'
const defaults = extendOptions(getDefaults())

describe('defaults', () => {
  it('it should have default shortcut', () => {
    should(defaults.overloadTranslationOptionHandler(['key', 'my default value'])).eql({
      defaultValue: 'my default value'
    })
  })

  it('defaultValue as option', () => {
    should(
      defaults.overloadTranslationOptionHandler(['key', { defaultValue: 'option default value' }])
    ).eql({ defaultValue: 'option default value' })
  })

  it('description', () => {
    should(
      defaults.overloadTranslationOptionHandler(['key', 'my default value', 'the description'])
    ).eql({ defaultValue: 'my default value', tDescription: 'the description' })
  })

  it('description with options defaultValue', () => {
    // Options overwrites params default value
    should(
      defaults.overloadTranslationOptionHandler(['key', 'my default value', 'the description'])
    ).eql({ defaultValue: 'my default value', tDescription: 'the description' })
  })

  it('interpolation', () => {
    should(
      defaults.overloadTranslationOptionHandler([
        'key',
        'my default value {{params}}',
        { params: 'the value' }
      ])
    ).eql({ defaultValue: 'my default value {{params}}', params: 'the value' })
  })

  it('interpolation with options defaultValue', () => {
    // Options overwrites params default value
    should(
      defaults.overloadTranslationOptionHandler([
        'key',
        'my default value {{params}}',
        { defaultValue: 'options default value', params: 'the value' }
      ])
    ).eql({ defaultValue: 'options default value', params: 'the value' })
  })

  it('interpolation description', () => {
    should(
      defaults.overloadTranslationOptionHandler([
        'key',
        'my default value {{params}}',
        'the description',
        { params: 'the value' }
      ])
    ).eql({
      defaultValue: 'my default value {{params}}',
      params: 'the value',
      tDescription: 'the description'
    })
  })

  it('interpolation description with options defaultValue', () => {
    // Options overwrites params default value
    should(
      defaults.overloadTranslationOptionHandler([
        'key',
        'my default value {{params}}',
        'the description',
        { defaultValue: 'options default value', params: 'the value' }
      ])
    ).eql({
      defaultValue: 'options default value',
      params: 'the value',
      tDescription: 'the description'
    })
  })

  it('it should have default format function', () => {
    should(defaults.interpolation.format('my value', '###', 'de')).eql('my value')
  })
})
