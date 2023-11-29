import { ensureDirectoryExistence } from '../utils/fs'
import fs from 'fs'
export class Parser {
  constructor(languageIds, supportedExts) {
    this.languageIds = languageIds
    this.supportedExts = supportedExts
    this.supportedExtsRegex = new RegExp(`.?(${this.supportedExts})$`)
  }

  supports(ext) {
    return !!ext.toLowerCase().match(this.supportedExtsRegex)
  }

  async load(filepath) {
    const raw = fs.readFileSync(filepath, 'utf-8')
    if (!raw) return {}
    return await this.parse(raw)
  }

  async save(filepath, object) {
    const text = await this.dump(object)
    ensureDirectoryExistence(filepath)
    fs.writeFileSync(filepath, text)
  }

  parse(text) {}

  dump(object) {}
}
