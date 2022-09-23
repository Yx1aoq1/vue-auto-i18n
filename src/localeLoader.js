import fg from 'fast-glob'
import path from 'path'
import { uniq } from 'lodash'
import { Global } from './global'
import { flatten } from './utils/flat'

export class LocaleLoader {
  constructor(rootpath) {
    this.rootpath = rootpath
    this._files = {}
  }

  async init() {
    if (await this.findLocaleDirs()) {
      this._pathMatchers = Global.getPathMatchers()
      await this.loadAll()
    }
  }

  async findLocaleDirs() {
    const localesPaths = Global.localesPaths
    if (localesPaths && localesPaths.length) {
      try {
        const _localeDirs = await fg(localesPaths, {
          cwd: this.rootpath,
          onlyDirectories: true,
        })
        if (localesPaths.includes('.')) _localeDirs.push('.')
        this._localeDirs = uniq(_localeDirs.map(p => path.resolve(this.rootpath, p)))
      } catch (e) {
        logger.error(e)
      }
    }

    if (this._localeDirs.length === 0) {
      logger.info('\n⚠ No locales paths.')
      return false
    }

    return true
  }

  async loadAll() {
    for (const pathname of this._localeDirs) {
      await this.loadDirectory(pathname)
    }
  }

  async loadDirectory(searchingPath) {
    const files = await fg('**/*.*', {
      cwd: searchingPath,
      onlyFiles: true,
      ignore: ['node_modules/**', 'vendors/**', ...Global.ignoreFiles],
      deep: Global.includeSubfolders ? undefined : 2,
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
      if (namespace === 'index') return
      let data = await parser.load(filepath)
      const value = flatten(data)
      this._files[filepath] = {
        filepath,
        dirpath,
        locale,
        value,
        namespace,
        matcher,
      }
    } catch (e) {
      logger.error(e)
    }
  }

  getFileInfo(dirpath, relativePath) {
    const fullpath = path.resolve(dirpath, relativePath)
    const ext = path.extname(relativePath)

    let match = null
    let matcher

    for (const r of this._pathMatchers) {
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
      locale = Global.sourceLanguage
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

  findMatchKey(text, namespace = '') {}
}
