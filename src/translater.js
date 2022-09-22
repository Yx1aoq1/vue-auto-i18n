import getConfig from './utils/config'
import { LocaleLoader } from './localeLoader'

class Translater {
  static async create() {
    global.Config = getConfig()
    const localeLoader = new LocaleLoader(process.cwd())
    await localeLoader.init()
    return new Translater(localeLoader)
  }
  constructor(localeLoader) {
    this.localeLoader = localeLoader
  }
}
