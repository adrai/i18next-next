// serve translations
import express from 'express'

// i18next in action...
import i18next from 'i18next'
import Backend from 'i18next-http-backend'
import compatibilityLayer from '../../test/helpers/compatibilityLayer.js'

const i18n = i18next({
  debug: true,
  lng: 'en',
  fallbackLng: 'en',
  preload: ['en', 'de']
}).use(compatibilityLayer(Backend, {
  loadPath: 'http://localhost:8080/locales/{{lng}}/{{ns}}.json'
}))

const app = express()
app.use('/locales', express.static('locales'))
app.listen(8080, () => {
  i18n.init().then(() => {
    console.log('i18next is ready...')
    console.log(i18n.t('welcome'))
    console.log(i18n.t('welcome', { lng: 'de' }))
  })
})
