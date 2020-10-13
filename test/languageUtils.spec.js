import LanguageUtils from '../src/LanguageUtils.js'
import should from 'should'

describe('LanguageUtils', () => {
  describe('toResolveHierarchy()', () => {
    let cu

    before(() => {
      cu = new LanguageUtils({ fallbackLng: 'en' })
    })

    const tests = [
      { args: ['en'], shoulded: ['en'] },
      { args: ['de'], shoulded: ['de', 'en'] },
      { args: ['de', 'fr'], shoulded: ['de', 'fr'] },
      { args: ['de', ['fr', 'en']], shoulded: ['de', 'fr', 'en'] },
      { args: ['de', ['fr', 'de']], shoulded: ['de', 'fr'] },
      { args: ['de-CH'], shoulded: ['de-CH', 'de', 'en'] },
      { args: ['nb-NO'], shoulded: ['nb-NO', 'nb', 'en'] },
      { args: ['zh-Hant-MO'], shoulded: ['zh-Hant-MO', 'zh-Hant', 'zh', 'en'] },
      { args: ['de-x-custom1'], shoulded: ['de-x-custom1', 'de', 'en'] },
      { args: ['de-DE-x-custom1'], shoulded: ['de-DE-x-custom1', 'de', 'en'] }
    ]

    tests.forEach(test => {
      it('correctly prepares resolver for ' + JSON.stringify(test.args) + ' args', () => {
        should(cu.toResolveHierarchy.apply(cu, test.args)).eql(test.shoulded)
      })
    })
  })

  describe('toResolveHierarchy() - extended fallback object', () => {
    let cu

    before(() => {
      cu = new LanguageUtils({
        fallbackLng: {
          de: ['de-CH', 'en'],
          'de-CH': ['fr', 'it', 'en'],
          'zh-Hans': ['zh-Hant', 'zh', 'en'],
          'zh-Hant': ['zh-Hans', 'zh', 'en'],
          nb: ['no'],
          nn: ['no'],
          default: ['en']
        }
      })
    })

    const tests = [
      { args: ['en'], shoulded: ['en'] },
      { args: ['de'], shoulded: ['de', 'de-CH', 'en'] },
      { args: ['de-CH'], shoulded: ['de-CH', 'de', 'fr', 'it', 'en'] },
      { args: ['nb-NO'], shoulded: ['nb-NO', 'nb', 'no'] },
      { args: ['nn'], shoulded: ['nn', 'no'] },
      { args: ['zh-Hant-MO'], shoulded: ['zh-Hant-MO', 'zh-Hant', 'zh', 'zh-Hans', 'en'] }
    ]

    tests.forEach(test => {
      it('correctly prepares resolver for ' + JSON.stringify(test.args) + ' args', () => {
        should(cu.toResolveHierarchy.apply(cu, test.args)).eql(test.shoulded)
      })
    })
  })

  describe('toResolveHierarchy() - fallback function returns object', () => {
    let cu

    before(() => {
      cu = new LanguageUtils({
        fallbackLng: () => ({
          de: ['de-CH', 'en'],
          'de-CH': ['fr', 'it', 'en'],
          'zh-Hans': ['zh-Hant', 'zh', 'en'],
          'zh-Hant': ['zh-Hans', 'zh', 'en'],
          nb: ['no'],
          nn: ['no'],
          default: ['en']
        })
      })
    })

    const tests = [
      { args: ['en'], shoulded: ['en'] },
      { args: ['de'], shoulded: ['de', 'de-CH', 'en'] },
      { args: ['de-CH'], shoulded: ['de-CH', 'de', 'fr', 'it', 'en'] },
      { args: ['nb-NO'], shoulded: ['nb-NO', 'nb', 'no'] },
      { args: ['nn'], shoulded: ['nn', 'no'] },
      { args: ['zh-Hant-MO'], shoulded: ['zh-Hant-MO', 'zh-Hant', 'zh', 'zh-Hans', 'en'] }
    ]

    tests.forEach(test => {
      it('correctly prepares resolver for ' + JSON.stringify(test.args) + ' args', () => {
        should(cu.toResolveHierarchy.apply(cu, test.args)).eql(test.shoulded)
      })
    })
  })

  describe('toResolveHierarchy() - fallback function returns string', () => {
    let cu

    before(() => {
      cu = new LanguageUtils({
        fallbackLng: () => 'en'
      })
    })

    const tests = [
      { args: ['en'], shoulded: ['en'] },
      { args: ['de'], shoulded: ['de', 'en'] },
      { args: ['de', 'fr'], shoulded: ['de', 'fr'] },
      { args: ['de', ['fr', 'en']], shoulded: ['de', 'fr', 'en'] },
      { args: ['de', ['fr', 'de']], shoulded: ['de', 'fr'] },
      { args: ['de-CH'], shoulded: ['de-CH', 'de', 'en'] },
      { args: ['nb-NO'], shoulded: ['nb-NO', 'nb', 'en'] },
      { args: ['zh-Hant-MO'], shoulded: ['zh-Hant-MO', 'zh-Hant', 'zh', 'en'] },
      { args: ['de-x-custom1'], shoulded: ['de-x-custom1', 'de', 'en'] },
      { args: ['de-DE-x-custom1'], shoulded: ['de-DE-x-custom1', 'de', 'en'] }
    ]

    tests.forEach(test => {
      it('correctly prepares resolver for ' + JSON.stringify(test.args) + ' args', () => {
        should(cu.toResolveHierarchy.apply(cu, test.args)).eql(test.shoulded)
      })
    })
  })

  describe('toResolveHierarchy() - fallback function returns array', () => {
    let cu

    before(() => {
      cu = new LanguageUtils({
        fallbackLng: () => ['de', 'en', 'zh']
      })
    })

    const tests = [
      { args: ['en'], shoulded: ['en', 'de', 'zh'] },
      { args: ['de'], shoulded: ['de', 'en', 'zh'] },
      { args: ['de-AT'], shoulded: ['de-AT', 'de', 'en', 'zh'] },
      { args: ['zh-HK'], shoulded: ['zh-HK', 'zh', 'de', 'en'] },
      { args: ['zh-CN'], shoulded: ['zh-CN', 'zh', 'de', 'en'] }
    ]

    tests.forEach(test => {
      it('correctly prepares resolver for ' + JSON.stringify(test.args) + ' args', () => {
        should(cu.toResolveHierarchy.apply(cu, test.args)).eql(test.shoulded)
      })
    })
  })

  describe('toResolveHierarchy() - cleanCode Option', () => {
    let cu

    before(() => {
      cu = new LanguageUtils({ fallbackLng: 'en', cleanCode: true })
    })

    const tests = [
      { args: ['EN'], shoulded: ['en'] },
      { args: ['DE'], shoulded: ['de', 'en'] },
      { args: ['DE', 'fr'], shoulded: ['de', 'fr'] },
      { args: ['de', ['FR', 'en']], shoulded: ['de', 'fr', 'en'] },
      { args: ['de', ['fr', 'de']], shoulded: ['de', 'fr'] },
      { args: ['DE-CH'], shoulded: ['de-CH', 'de', 'en'] },
      { args: ['NB-NO'], shoulded: ['nb-NO', 'nb', 'en'] },
      { args: ['ZH-HANT-MO'], shoulded: ['zh-Hant-MO', 'zh-Hant', 'zh', 'en'] }
    ]

    tests.forEach(test => {
      it('correctly prepares resolver for ' + JSON.stringify(test.args) + ' args', () => {
        should(cu.toResolveHierarchy.apply(cu, test.args)).eql(test.shoulded)
      })
    })
  })

  describe('toResolveHierarchy() - lowerCaseLng Option', () => {
    let cu

    before(() => {
      cu = new LanguageUtils({ fallbackLng: 'en', lowerCaseLng: true })
    })

    const tests = [
      { args: ['EN'], shoulded: ['en'] },
      { args: ['DE'], shoulded: ['de', 'en'] },
      { args: ['DE', 'fr'], shoulded: ['de', 'fr'] },
      { args: ['de', ['FR', 'en']], shoulded: ['de', 'fr', 'en'] },
      { args: ['de', ['fr', 'de']], shoulded: ['de', 'fr'] },
      { args: ['DE-CH'], shoulded: ['de-ch', 'de', 'en'] },
      { args: ['nb-NO'], shoulded: ['nb-no', 'nb', 'en'] },
      { args: ['zh-Hant-MO'], shoulded: ['zh-hant-mo', 'zh-hant', 'zh', 'en'] }
    ]

    tests.forEach(test => {
      it('correctly prepares resolver for ' + JSON.stringify(test.args) + ' args', () => {
        should(cu.toResolveHierarchy.apply(cu, test.args)).eql(test.shoulded)
      })
    })
  })

  describe('toResolveHierarchy() - load Option: lngOnly', () => {
    let cu

    before(() => {
      cu = new LanguageUtils({ fallbackLng: 'en', load: 'languageOnly' })
    })

    const tests = [
      { args: ['en'], shoulded: ['en'] },
      { args: ['de'], shoulded: ['de', 'en'] },
      { args: ['de', 'fr'], shoulded: ['de', 'fr'] },
      { args: ['de', ['fr', 'en']], shoulded: ['de', 'fr', 'en'] },
      { args: ['de', ['fr', 'de']], shoulded: ['de', 'fr'] },
      { args: ['de-CH'], shoulded: ['de', 'en'] },
      { args: ['nb-NO'], shoulded: ['nb', 'en'] },
      { args: ['zh-Hant-MO'], shoulded: ['zh', 'en'] }
    ]

    tests.forEach(test => {
      it('correctly prepares resolver for ' + JSON.stringify(test.args) + ' args', () => {
        should(cu.toResolveHierarchy.apply(cu, test.args)).eql(test.shoulded)
      })
    })
  })

  describe('toResolveHierarchy() - load Option: currentOnly', () => {
    let cu

    before(() => {
      cu = new LanguageUtils({ fallbackLng: 'en', load: 'currentOnly' })
    })

    const tests = [
      { args: ['en'], shoulded: ['en'] },
      { args: ['de'], shoulded: ['de', 'en'] },
      { args: ['de', 'fr'], shoulded: ['de', 'fr'] },
      { args: ['de', ['fr', 'en']], shoulded: ['de', 'fr', 'en'] },
      { args: ['de', ['fr', 'de']], shoulded: ['de', 'fr'] },
      { args: ['de-CH'], shoulded: ['de-CH', 'en'] },
      { args: ['nb-NO'], shoulded: ['nb-NO', 'en'] },
      { args: ['zh-Hant-MO'], shoulded: ['zh-Hant-MO', 'en'] }
    ]

    tests.forEach(test => {
      it('correctly prepares resolver for ' + JSON.stringify(test.args) + ' args', () => {
        should(cu.toResolveHierarchy.apply(cu, test.args)).eql(test.shoulded)
      })
    })
  })

  describe('toResolveHierarchy() - supportedLngs', () => {
    let cu

    before(() => {
      cu = new LanguageUtils({ fallbackLng: 'en', supportedLngs: ['nb-NO', 'de', 'en'] })
      cu.logger.setDebug(false) // silence
    })

    const tests = [
      { args: ['en'], shoulded: ['en'] },
      { args: ['de'], shoulded: ['de', 'en'] },
      { args: ['de', 'fr'], shoulded: ['de'] },
      { args: ['de', ['fr', 'en']], shoulded: ['de', 'en'] },
      { args: ['de', ['fr', 'de']], shoulded: ['de'] },
      { args: ['de-CH'], shoulded: ['de', 'en'] },
      { args: ['nb-NO'], shoulded: ['nb-NO', 'en'] }
    ]

    tests.forEach(test => {
      it('correctly prepares resolver for ' + JSON.stringify(test.args) + ' args', () => {
        should(cu.toResolveHierarchy.apply(cu, test.args)).eql(test.shoulded)
      })
    })
  })

  describe('toResolveHierarchy() - non explicit supportedLngs ', () => {
    let cu

    before(() => {
      cu = new LanguageUtils({
        fallbackLng: ['en'],
        supportedLngs: ['de', 'en', 'zh'],
        nonExplicitSupportedLngs: true
      })
    })

    const tests = [
      { args: ['en'], shoulded: ['en'] },
      { args: ['de'], shoulded: ['de', 'en'] },
      { args: ['de-AT'], shoulded: ['de-AT', 'de', 'en'] },
      { args: ['zh-HK'], shoulded: ['zh-HK', 'zh', 'en'] },
      { args: ['zh-CN'], shoulded: ['zh-CN', 'zh', 'en'] }
    ]

    tests.forEach(test => {
      it('correctly prepares resolver for ' + JSON.stringify(test.args) + ' args', () => {
        should(cu.toResolveHierarchy.apply(cu, test.args)).eql(test.shoulded)
      })
    })
  })

  describe('getBestMatchFromCodes()', () => {
    let cu

    before(() => {
      cu = new LanguageUtils({
        fallbackLng: ['en'],
        supportedLngs: ['en-US', 'en', 'de-DE']
      })
    })

    const tests = [
      { args: [['en']], shoulded: 'en' },
      { args: [['ru', 'en']], shoulded: 'en' },
      { args: [['en-GB']], shoulded: 'en' },
      { args: [['ru', 'en-GB']], shoulded: 'en' },
      { args: [['de-CH']], shoulded: 'de-DE' },
      { args: [['ru']], shoulded: 'en' },
      { args: [[]], shoulded: 'en' }
    ]

    tests.forEach(test => {
      it('correctly get best match for ' + JSON.stringify(test.args) + ' args', () => {
        should(cu.getBestMatchFromCodes.apply(cu, test.args)).eql(test.shoulded)
      })
    })
  })
})
