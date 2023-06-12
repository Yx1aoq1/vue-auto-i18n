import getConfig from './utils/config'
import { ParsePathMatcher } from './utils/pathMatcher'
import { uniq } from 'lodash'
import { extname } from 'path'
import { AvailableParsers } from './parsers'

const Config = getConfig()
export class Global {
  // 可处理的文件拓展名
  static enableTransExts = ['vue', 'js', 'html', 'ts']
  // 默认导出对应的语言
  static sourceLanguage = Config.sourceLanguage || 'zh-cn'
  // 读取locales配置时对应的拓展名
  static enabledParsers = AvailableParsers.filter(i => (Config.enabledParsers || ['js', 'json']).includes(i.id))
  // locales配置的文件夹路径
  static localesPaths = Config.localesPaths
  // 是否有命名空间
  static namespace = Config.namespace || false
  // locales文件匹配
  static pathMatcher = Config.pathMatcher
  // 忽略的文件夹
  static ignoreFiles = Config.ignoreFiles || []
  // 包含的文件夹层级
  static includeSubfolders = Config.includeSubfolders
  // 生成locale key的方法
  static generateLocaleKey = Config.generateLocaleKey
  // 翻译解析模式
  static translateMode = Config.translateMode || 'vue'
  // 可自定义翻译的localekey生成规则函数
  static stringToIdentifier = Config.stringToIdentifier
  static getPathMatchers() {
    const rules = Array.isArray(Config.pathMatcher) ? Config.pathMatcher : [Config.pathMatcher]
    const enabledParserExts = Global.enabledParsers.map(item => item.id).join('|')
    return uniq(rules).map(matcher => ({
      regex: ParsePathMatcher(matcher, enabledParserExts),
      matcher
    }))
  }
  //
  static getMatchedParser(ext) {
    if (!ext.startsWith('.') && ext.includes('.')) ext = extname(ext)
    return Global.enabledParsers.find(parser => parser.supports(ext))
  }
}
