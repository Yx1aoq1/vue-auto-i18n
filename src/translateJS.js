import { codeReplace, splice } from './utils/common'
import { parseTemplate } from './parseTemplate'

export default function translateJS (code, languageUtils, exportName, isVue = true) {
	let isImportI18nFun = false
	const exportLocation = code.indexOf('export')
	const handleToken =
		USER_CONFIG.translateJSFun ||
		function (token, isInVue) {
			if (isInVue === undefined) {
				isInVue = isVue && token.start > exportLocation
			}
			const params = (token.params || []).map(item => ({
				name: item.name,
				value: item.expression && codeReplace(item.expression, item.tokens, t => handleToken(t, isInVue))
			}))
			const identifier = languageUtils.stringToIdentifier(exportName, token.text, params)
			let value
			if (isInVue) {
				value = `this.${identifier}`
			} else {
				value = `i18n.${identifier.substring(1)}`
				isImportI18nFun = true
			}
			return value
		}
	code = codeReplace(code, parseTemplate(code), handleToken)
	// 是否引入i18n函数
	if (isImportI18nFun && USER_CONFIG.importI18nFunction) {
		const start = isVue ? 2 : 0 // vue 文件中首个字符通常为换行
		code = splice(code, start, start, `${USER_CONFIG.importI18nFunction}\r\n`)
	}
	return code
}
