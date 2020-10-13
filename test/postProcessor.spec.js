import i18next from '../index.js'
import should from 'should'

describe('post processing', () => {
  it('should handle it', async () => {
    const i18n = i18next({ lng: 'en' })
    i18n.addHook('read', (toLoad) => {
      const res = {}
      Object.keys(toLoad).forEach((lng) => {
        toLoad[lng].forEach((ns) => {
          res[lng] = res[lng] || {}
          res[lng][ns] = {
            key: '(1){one item};(2-7){a few items};(7-inf){a lot of items};'
          }
        })
      })
      return res
    })
    const intervalMatches = (interval, count) => {
      if (interval.indexOf('-') > -1) {
        const p = interval.split('-')
        if (p[1] === 'inf') {
          const from = parseInt(p[0], 10)
          return count >= from
        } else {
          const from = parseInt(p[0], 10)
          const to = parseInt(p[1], 10)
          return count >= from && count <= to
        }
      } else {
        const match = parseInt(interval, 10)
        return match === count
      }
    }
    i18n.addHook('postProcess', 'my-post-processor', (value, key, opt) => {
      const p = value.split(';')
      let found
      p.forEach((iv) => {
        if (found) return
        const match = /\((\S*)\).*{((.|\n)*)}/.exec(iv)

        if (match && intervalMatches(match[1], opt[i18n.options.pluralOptionProperty] || 0)) {
          found = match[2]
        }
      })
      return found || value
    })
    await i18n.init()
    const translated = i18n.t('key', { postProcess: 'my-post-processor', count: 2 })
    should(translated).eql('a few items')
  })
})
