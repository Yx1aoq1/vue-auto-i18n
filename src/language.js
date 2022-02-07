import fs from 'fs'
import path from 'path'
import { getFilenameWithoutExt, flatten, getRandomStr } from './utils/common'
import { readESModuleFile } from './utils/fs'

export default class LanguageUtils {
  constructor (lang) {
    this.cfg = USER_CONFIG
    this.map = this.createMap(lang)
  }

  createMap (lang) {
    const langPath = path.resolve(process.cwd(), this.cfg.languagePath, lang)
    const i18nMap = new Map()
    fs.readdirSync(langPath)
      .filter(filename => filename !== 'index.js' && filename.indexOf('.js') > -1)
      .forEach(filename => {
        const name = getFilenameWithoutExt(filename)
        const filepath = path.resolve(langPath, filename)
        const flatI18n = flatten(readESModuleFile(filepath))
        i18nMap.set(name, flatI18n)
      })
    return i18nMap
  }

  findKey (name, text) {
    for (const [key, value] of this.map.entries()) {
      for (const subKey of Object.keys(value)) {
        if (value[subKey] === text) {
          return `${key}.${subKey}`
        }
      }
    }
    const newKey = getRandomStr()
    this.updateKey(name, newKey, text)
    return `${name}.${newKey}`
  }

  updateKey (name, key, value) {
    const i18n = this.map.get(name) || {}
    i18n[key] = value
    this.map.set(name, i18n)
  }
}