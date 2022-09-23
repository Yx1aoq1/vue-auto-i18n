import getConfig from './utils/config'
import { ParsePathMatcher } from './utils/pathMatcher'
import { uniq } from 'lodash'
import { extname } from 'path'
import { AvailableParsers } from './parsers'

const Config = getConfig()
export class Global {
  // 默认导出excel列名
  static excelCols = {
    'zh-cn': '中文',
    en: '英文翻译',
    unknow: '未知',
  }
  // 可处理的文件拓展名
  static enableTransExts = ['vue', 'js', 'html', 'ts']
  // locales对应的文件夹名称
  static languages = Config.languages || ['zh-cn', 'en']
  // 默认导出对应的语言
  static sourceLanguage = Config.languages || 'zh-cn'
  // 读取locales配置时对应的拓展名
  static enabledParsers = AvailableParsers.filter(i => (Config.enabledParsers || ['js', 'json']).includes(i.id))
  // locales配置的文件夹路径
  static localesPaths = Config.localesPaths
  // 导出翻译的文件夹路径
  static outputLocalesPath = Config.outputLocalesPath
  // 是否有命名空间
  static namespace = Config.namespace || false
  // locales文件匹配
  static pathMatcher = Config.pathMatcher
  // 导入的i18n函数string
  static importI18nFunction = Config.importI18nFunction
  //
  static ignoreFiles = Config.ignoreFiles || []
  //
  static includeSubfolders = Config.includeSubfolders
  //
  static getPathMatchers() {
    const rules = Array.isArray(Config.pathMatcher) ? Config.pathMatcher : [Config.pathMatcher]
    const enabledParserExts = Global.enabledParsers.map(item => item.id).join('|')
    return uniq(rules).map(matcher => ({
      regex: ParsePathMatcher(matcher, enabledParserExts),
      matcher,
    }))
  }
  //
  static getMatchedParser(ext) {
    if (!ext.startsWith('.') && ext.includes('.')) ext = extname(ext)
    return Global.enabledParsers.find(parser => parser.supports(ext))
  }
}
