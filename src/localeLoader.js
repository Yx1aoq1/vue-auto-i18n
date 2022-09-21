import fg from 'fast-glob'
import path from 'path'
import { uniq } from 'lodash'
import { ParsePathMatcher } from './utils/pathMatcher'

export class LocaleLoader {
  constructor() {
    this.rootpath = process.cwd()
  }

  async init() {
    if (await this.findLocaleDirs()) {
      this._path_matchers = this.getPathMatchers()
      await this.loadAll()
    }
    // this.update()
  }

  async findLocaleDirs() {
    const localesPaths = Config.localesPaths
    if (localesPaths && localesPaths.length) {
      try {
        const _locale_dirs = await fg(localesPaths, {
          cwd: this.rootpath,
          onlyDirectories: true,
        })
        if (localesPaths.includes('.')) _locale_dirs.push('.')
        this._locale_dirs = uniq(_locale_dirs.map(p => path.resolve(this.rootpath, p)))
      } catch (e) {
        logger.error(e)
      }
    }

    if (this._locale_dirs.length === 0) {
      logger.info('\n⚠ No locales paths.')
      return false
    }

    return true
  }

  getPathMatchers() {
    const rules = [Config.pathMatcher]
    return uniq(rules).map(matcher => ({
      regex: ParsePathMatcher(matcher, Config.enabledParsers.join('|')),
      matcher,
    }))
  }

  async loadAll() {
    for (const pathname of this._locale_dirs) {
      await this.loadDirectory(pathname)
    }
  }

  async loadDirectory(searchingPath) {
    const files = await fg('**/*.*', {
      cwd: searchingPath,
      onlyFiles: true,
      ignore: ['node_modules/**', 'vendors/**', ...Config.ignoreFiles],
      deep: Config.includeSubfolders ? undefined : 2,
    })
    for (const relative of files) {
      await this.loadFile(searchingPath, relative)
    }
  }

  async loadFile(dirpath, relativePath) {
    try {
      const result = this.getFileInfo(dirpath, relativePath)
      if (!result) return
      const { locale, parser, namespace, fullpath: filepath, matcher } = result
      if (!parser) return
      if (!locale) return
    } catch (e) {}
  }

  getFileInfo(dirpath, relativePath) {
    const fullpath = path.resolve(dirpath, relativePath)
    const ext = path.extname(relativePath)

    let match = null
    let matcher

    for (const r of this._path_matchers) {
      match = r.regex.exec(relativePath)
      if (match && match.length > 0) {
        matcher = r.matcher
        break
      }
    }

    if (!match || match.length < 1) return

    let namespace = match.groups?.namespace
    if (namespace) namespace = namespace.replace(/\//g, '.')

    let locale = match.groups?.locale
    if (!locale) {
      locale = Config.sourceLanguage
    }
    if (!locale) return

    const parser = Global.getMatchedParser(ext)

    return {
      locale,
      parser,
      ext,
      namespace,
      fullpath,
      matcher,
    }
  }
}
