import i18next from '../index.js'
import should from 'should'
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const logger = {
  entries: {
    log: [],
    warn: [],
    error: []
  },

  log (args) {
    this.entries.log.push(args[0])
  },
  warn (args) {
    this.entries.warn.push(args[0])
  },
  error (args) {
    this.entries.error.push(args[0])
  },

  reset () {
    this.entries = {
      log: [],
      warn: [],
      error: []
    }
  }
}

let created = []
const getI18n = (opt) => {
  const i18n = i18next(opt)
  i18n.use(logger)
  i18n.addHook('read', (toLoad) => {
    const lngs = Object.keys(toLoad)
    const nss = toLoad[lngs[0]]
    if (nss.find((ns) => ns.indexOf('fail') === 0)) {
      const err = new Error('failed')
      err.retry = false
      throw err
    }
    return { status: 'ok', key: `${lngs[0]}-${nss[0]}` }
  })
  i18n.addHook('')
  i18n.addHook('handleMissingKey', (key, ns, lng, value, options) => {
    created.push(`${lng.join('-')}-${ns}-${key}`)
  })
  return i18n
}
let i18n = getI18n({ debug: true, saveMissing: true })

describe('i18next', () => {
  describe('isNamespaceLoaded', () => {
    describe('not called init()', () => {
      it('should nok', () => {
        should(i18n.isInitialized).not.be.ok()
        should(i18n.isNamespaceLoaded('ns1')).eql(false)
      })
    })

    describe('called init() not detecting lng', () => {
      it('should ok - but warn about issue', async () => {
        await i18n.init()
        should(i18n.isInitialized).eql(true)
        should(i18n.isNamespaceLoaded('translation')).eql(true) // this is a new behaviour, in old i18next this was false

        should(logger.entries.warn[0]).eql(
          'i18next: init: no lng is defined and no languageDetector is used'
        )
        logger.reset()
      })
    })

    describe('called init() properly', () => {
      before(async () => {
        i18n = getI18n({ debug: true, saveMissing: true, lng: 'en-US' })
        await i18n.init()
      })

      it('should ok for loaded ns', () => {
        should(i18n.isNamespaceLoaded('translation')).eql(true)
      })

      it('should nok for not loaded ns', () => {
        should(i18n.isNamespaceLoaded('ns1')).eql(false)
      })

      describe('translator - calling t', () => {
        it('should not log anything if loaded ns', () => {
          i18n.t('keyNotFound')
          should(logger.entries.warn.length).eql(1) // this is a new behaviour, in old i18next this was 0
          should(logger.entries.warn[0]).eql(
            'i18next: No value found for key "keyNotFound" in namespace "translation" for language "en-US"!'
          )
          logger.reset()
        })

        it('should not call saveMissing create on backend if not loaded ns', async () => {
          created = []
          i18n.t('ns1:keyNotFound')
          wait(20)

          should(created.length).eql(0)
          created = []
          should(logger.entries.warn.length).eql(3)
          should(logger.entries.warn[0]).eql(
            'i18next: key "keyNotFound" for languages "en-US, en, dev" won\'t get resolved as namespace "ns1" was not yet loaded'
          )
          logger.reset()
        })
      })

      describe('backendConnector - saveMissing', async () => {
        it('should call saveMissing create on backend if loaded ns', () => {
          created = []
          i18n.t('keyNotFound')
          wait(20)

          should(created.length).eql(1)
          should(created[0]).eql('dev-translation-keyNotFound')
          created = []
          logger.reset()
        })

        it('should not call saveMissing create on backend if not loaded ns', () => {
          i18n.t('ns1:keyNotFound')
          wait(20)

          should(created.length).eql(0)
          created = []

          should(logger.entries.warn.length).eql(3)
          should(logger.entries.warn[2]).eql(
            'i18next: did not save key "keyNotFound" as the namespace "ns1" was not yet loaded'
          )
          logger.reset()
        })
      })
    })

    describe('for a namespace failed loading', () => {
      before(async () => {
        await i18n.loadNamespaces('fail-ns')
      })

      it('should ok for loaded ns', () => {
        should(i18n.isNamespaceLoaded('fail-ns')).eql(true)
      })
    })
  })

  describe('for lng = cimode', () => {
    before(async () => {
      await i18n.changeLanguage('cimode')
    })

    it('should ok for loaded ns', () => {
      should(i18n.isNamespaceLoaded('translation')).eql(true)
    })

    it('should ok for not loaded ns', () => {
      should(i18n.isNamespaceLoaded('ns1')).eql(true)
    })
  })

  describe('not having a backend', () => {
    const i18n2 = i18next({
      debug: true,
      lng: 'en-US'
    })
    i18n2.use(logger)
    i18n2.addHook('loadResources', () => ({ 'en-US': { translation: {} }, dev: { translation: {} } }))
    before(async () => {
      await i18n2.init()
    })

    it('should ok for passed in ns', () => {
      should(i18n2.isNamespaceLoaded('translation')).eql(true)
    })

    it('should ok for not passed in ns - as there is no loading done', () => {
      should(i18n2.isNamespaceLoaded('ns1')).eql(true)
    })
  })
})
