import { splice, once } from './utils/common'
import parseTemplate from './parseTemplate'

export default function translateJS (code, languageUtils, exportName, isVue = true) {
	function codeReplace (start, end, replace) {
		code = splice(code, start + offset, end + offset, replace)
		offset = code.length - origin.length
	}

	const importI18nFun = once(importFun => {
		const start = isVue ? 2 : 0 // vue 文件中首个字符通常为换行
		code = splice(code, start, start, `${importFun}\r\n`)
		offset = code.length - origin.length
	})

	const origin = code
	const tokens = parseTemplate(origin)
	const exportLocation = origin.indexOf('export')
	let offset = 0
	tokens.forEach(token => {
		const params = (token.params || []).map(item => ({
			name: item.name,
			value: item.value && translateJS(item.value, languageUtils, exportName, isVue)
		}))
		const identifier = languageUtils.stringToIdentifier(exportName, token.text, params)
		let value
		if (isVue && token.start > exportLocation) {
			value = `this.${identifier}`
		} else {
			value = `i18n.${identifier.substring(1)}`
			USER_CONFIG.importI18nFunction && importI18nFun(USER_CONFIG.importI18nFunction)
		}
		codeReplace(token.start, token.end, value)
	})
	return code
}
