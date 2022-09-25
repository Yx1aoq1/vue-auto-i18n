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
		unknow: '未知'
	}
	// 可处理的文件拓展名
	static enableTransExts = [ 'vue', 'js', 'html', 'ts' ]
	// locales对应的文件夹名称
	static languages = Config.languages || [ 'zh-cn', 'en' ]
	// 默认导出对应的语言
	static sourceLanguage = Config.sourceLanguage || 'zh-cn'
	// 读取locales配置时对应的拓展名
	static enabledParsers = AvailableParsers.filter(i => (Config.enabledParsers || [ 'js', 'json' ]).includes(i.id))
	// locales配置的文件夹路径
	static localesPaths = Config.localesPaths
	// 是否有命名空间
	static namespace = Config.namespace || false
	// locales文件匹配
	static pathMatcher = Config.pathMatcher
	// 导入的i18n函数string
	static importI18nFunction = Config.importI18nFunction
	// 忽略的文件夹
	static ignoreFiles = Config.ignoreFiles || []
	// 包含的文件夹层级
	static includeSubfolders = Config.includeSubfolders
	// 重复策略：replace|ignore
	static repeatStrategy = Config.repeatStrategy || 'ignore'
	// 生成locale key的方法
	static generateLocaleKey = Config.generateLocaleKey
	// 翻译解析模式
	static translateMode = Config.translateMode || 'vue'
	// 翻译语言生成
	static stringToIdentifier = Config.stringToIdentifier
	static getPathMatchers () {
		const rules = Array.isArray(Config.pathMatcher) ? Config.pathMatcher : [ Config.pathMatcher ]
		const enabledParserExts = Global.enabledParsers.map(item => item.id).join('|')
		return uniq(rules).map(matcher => ({
			regex: ParsePathMatcher(matcher, enabledParserExts),
			matcher
		}))
	}
	//
	static getMatchedParser (ext) {
		if (!ext.startsWith('.') && ext.includes('.')) ext = extname(ext)
		return Global.enabledParsers.find(parser => parser.supports(ext))
	}
}
