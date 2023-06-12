import fg from 'fast-glob'
import path from 'path'
import { uniq, set, find, cloneDeep, first, sortBy, get, filter, assign } from 'lodash'
import { Global } from './global'
import { flatten, unflatten } from './utils/flat'
import { getRandomStr, getExtname } from './utils/common'

export class LocaleLoader {
  constructor(rootpath) {
    this.rootpath = rootpath
  }

  async init() {
    if (await this.findLocaleDirs()) {
      this._pathMatchers = Global.getPathMatchers()
      await this.loadAll()
    }
    this.update()
    // 获取所有语言并将sourceLanguage排序到第一个
    this.languages = sortBy([...Array.from(this._languages)], o => Number(o !== Global.sourceLanguage))
    this.namespaces = [...Array.from(this._namespaces)].filter(item => !!item)
  }

  async findLocaleDirs() {
    this._files = {}
    this._localeDirs = []
    this._languages = new Set()
    this._namespaces = new Set()
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
      this._languages.add(locale)
      this._namespaces.add(namespace)
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

    let namespace = match.groups && match.groups.namespace
    if (namespace) namespace = namespace.replace(/\//g, '.')

    let locale = match.groups && match.groups.locale
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

  update() {
    this._flattenLocaleData = {}
    this.files = Object.values(this._files)
    if (Global.namespace) {
      const namespaces = uniq(this.files.map(f => f.namespace))
      for (const ns of namespaces) {
        const files = this.files.filter(f => f.namespace === ns)

        for (const file of files) {
          const value = ns ? set({}, ns, file.value) : file.value
          this.updateLocaleData(value, file)
        }
      }
    } else {
      for (const file of this.files) {
        this.updateLocaleData(file.value, file)
      }
    }
  }

  updateLocaleData(data, options) {
    const { namespace, locale } = options
    set(this._flattenLocaleData, locale, assign({}, this._flattenLocaleData[locale], data))
  }

  findMatchLocaleKey(text, namespace) {
    const locale = Global.sourceLanguage
    const localeDatas = flatten(this._flattenLocaleData[locale])
    for (const key in localeDatas) {
      const value = localeDatas[key]
      if (text === value) {
        return key
      }
    }
    const newKey = this.generateLocaleKey(text)
    const localeKey = namespace ? `${namespace}.${newKey}` : newKey
    if (Global.namespace) {
      this.write({ key: newKey, text, namespace, locale })
    } else {
      this.write({ key: localeKey, text, locale })
    }
    return localeKey
  }

  write({ key, text, namespace, locale }) {
    const { filepath } = find(this.files, { namespace, locale }) || {}
    let original = {}
    if (this._files[filepath]) {
      original = this._files[filepath].value
    }
    let modified = cloneDeep(original)
    modified[key] = text
    // 已存在文件时，更新文件内容
    if (this._files[filepath]) {
      this._files[filepath].value = modified
    } else {
      // 不存在文件，需要创建一个新文件
      this.createNewLocaleFile(locale, namespace, modified)
    }
    this.update()
  }

  createNewLocaleFile(locale, namespace, data) {
    if (!locale) return
    // 获取已查询出的locale目录下的第一个文件作为范本
    const file = first(this.files)
    const dirpath = file.dirpath
    const ext = getExtname(file.filepath)
    const relativePath = Global.pathMatcher
      .replace('{locale}', locale)
      .replace('{namespace}', namespace)
      .replace('{namespaces}', namespace)
      .replace('{ext}', ext)
    const result = this.getFileInfo(dirpath, relativePath)
    if (!result) return
    const { fullpath: filepath, matcher } = result
    this._files[filepath] = {
      filepath,
      dirpath,
      locale,
      value: data,
      namespace,
      matcher,
    }
  }

  async export(namespace = '', locale = Global.sourceLanguage) {
    async function save(file) {
      const { filepath, value } = file
      const ext = path.extname(filepath)
      const parser = Global.getMatchedParser(ext)
      await parser.save(filepath, unflatten(value))
    }
    if (namespace && Global.namespace) {
      const file = find(this.files, { namespace, locale })
      await save(file)
    } else {
      const sourceLangFiles = filter(this.files, { locale })
      for (const file of sourceLangFiles) {
        await save(file)
      }
    }
  }

  generateLocaleKey(text) {
    if (Global.generateLocaleKey && typeof Global.generateLocaleKey === 'function') {
      return Global.generateLocaleKey.call(this, text)
    }
    // TODO: 对接一个翻译API
    if (Global.generateLocaleKey === 'translate') {
    }
    // 生成一个随机 key
    return `trans_${getRandomStr()}`
  }
  /**
   * 过滤符合条件的文件
   * @param {*} namespaces
   * @returns
   */
  findMatchFileByNamespaces(namespaces) {
    return this.files.filter(file => namespaces.includes(file.namespace))
  }
  /**
   * 找出对应翻译的值
   * @param {*} keypath
   * @returns
   */
  findTranslateByKeypath({ locale, namespace, keypath }) {
    const localeDatas = this._flattenLocaleData[locale]
    if (namespace) {
      if (keypath) {
        return get(localeDatas[namespace], keypath, '')
      }
      return localeDatas[namespace] || {}
    }
    return get(localeDatas, keypath, '')
  }
  /**
   * 找出所有匹配的翻译key
   * @param {*} text 查找字符
   * @param {*} fuzzy 是否模糊匹配
   * @returns 
   */
  findAllMatchLocaleKey(text, fuzzy = false) {
    const locale = Global.sourceLanguage
    const localeDatas = flatten(this._flattenLocaleData[locale])
    const result = []
    for (const key in localeDatas) {
      const value = localeDatas[key]
      if ((fuzzy && value.includes(text)) || text === value) {
        result.push(key)
      }
    }
    return result
  }
}
