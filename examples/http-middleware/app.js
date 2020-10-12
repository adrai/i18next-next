import express from 'express'

// i18next in action...
import i18next from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import Backend from 'i18next-fs-backend'
import compatibilityLayer from '../../test/helpers/compatibilityLayer.js'

const app = express()
const port = process.env.PORT || 8080

const i18n = i18next({
  // initImmediate: false,
  debug: true,
  lng: 'en',
  fallbackLng: 'en',
  preload: ['en', 'de'],
  ns: ['translation'],
  defaultNS: 'translation',
  saveMissing: true
}).use(compatibilityLayer(Backend, {
  loadPath: 'locales/{{lng}}/{{ns}}.json',
  addPath: 'locales/{{lng}}/{{ns}}.missing.json'
}))
  .use(compatibilityLayer(i18nextMiddleware.LanguageDetector))

i18n.init()

app.use(i18nextMiddleware.handle(i18n))

app.get('/', (req, res) => {
  console.log(req.language)
  res.send(req.t('welcome'))
})

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})
