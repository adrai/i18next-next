import EventEmitter from './EventEmitter.js'
import { isIE10, deepFind, deepExtend } from './utils.js'

const getValueOfKey = (data, lng, ns, key, keySeparator) => {
  if (!data || !data[lng] || !data[lng][ns]) return
  return deepFind(data[lng][ns], key, keySeparator)
}

const setValueForKey = (data, lng, ns, key, value) => {
  data = data || {}
  data[lng] = data[lng] || {}
  data[lng][ns] = data[lng][ns] || {}
  data[lng][ns][key] = value
  return data
}

class ResourceStore extends EventEmitter {
  constructor (data, options = { ns: ['translation'], defaultNS: 'translation' }) {
    super()
    if (isIE10) EventEmitter.call(this) // <=IE10 fix (unable to call parent constructor)

    this.data = data || {}
    this.options = options
    if (this.options.keySeparator === undefined) this.options.keySeparator = '.'
    this.seenNamespaces = [this.options.defaultNS]
  }

  calculateSeenNamespaces () {
    Object.keys(this.data).forEach((lng) => {
      Object.keys(this.data[lng]).forEach((ns) => {
        if (this.seenNamespaces.indexOf(ns) < 0) this.seenNamespaces.push(ns)
      })
    })
    if (this.seenNamespaces.indexOf(this.options.defaultNS) < 0) this.seenNamespaces.push(this.options.defaultNS)
  }

  getResource (lng, ns, key, options = {}) {
    if (!key) {
      if (!ns) return this.data[lng]
      return this.data[lng][ns]
    }
    const keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator
    return getValueOfKey(this.data, lng, ns, key, keySeparator)
  }

  addResource (lng, ns, key, value, options = { silent: false }) {
    // const keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator
    if (this.seenNamespaces.indexOf(ns) < 0) this.seenNamespaces.push(ns)
    setValueForKey(this.data, lng, ns, key, value)
    if (!options.silent) this.emit('added', lng, ns, key, value)
  }

  addResources (lng, ns, resources, options = { silent: false }) {
    for (const m in resources) {
      this.addResource(lng, ns, m, resources[m], { silent: true })
    }
    if (!options.silent) this.emit('added', lng, ns, resources)
  }

  addResourceBundle (lng, ns, resources, deep, overwrite, options = { silent: false }) {
    let pack = this.data && this.data[lng] && this.data[lng][ns]

    if (deep) {
      deepExtend(pack, resources, overwrite)
    } else {
      pack = { ...pack, ...resources }
    }

    if (this.seenNamespaces.indexOf(ns) < 0) this.seenNamespaces.push(ns)
    this.data[lng] = this.data[lng] || {}
    this.data[lng][ns] = pack

    if (!options.silent) this.emit('added', lng, ns, resources)
  }

  removeResourceBundle (lng, ns) {
    if (this.hasResourceBundle(lng, ns)) delete this.data[lng][ns]
    this.calculateSeenNamespaces()
    this.emit('removed', lng, ns)
  }

  hasResourceBundle (lng, ns) {
    if (!lng) return this.seenNamespaces.indexOf(ns) > -1
    return this.getResource(lng, ns) !== undefined
  }

  getResourceBundle (lng, ns) {
    if (!ns) ns = this.options.defaultNS

    return this.getResource(lng, ns)
  }

  getDataByLanguage (lng) {
    return this.data[lng]
  }

  getSeenNamespaces () {
    return this.seenNamespaces
  }

  setData (data) {
    this.data = data || {}
    this.calculateSeenNamespaces()
  }

  getData () {
    return this.data
  }

  toJSON () {
    return this.data
  }
}

export default ResourceStore
