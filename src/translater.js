import { LocaleLoader } from './localeLoader'

export class Translater {
  static async create() {
    const localeLoader = new LocaleLoader(process.cwd())
    await localeLoader.init()
    return new Translater(localeLoader)
  }
  constructor(localeLoader) {
    this.localeLoader = localeLoader
  }
}
