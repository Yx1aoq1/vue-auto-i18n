import Scanner from './scanner'
import { isChineseChar } from './utils/common'

const chinese = /[^\x00-\xff]+.*/g
const expression = /{{.*}}/
const vname = /^[a-zA-Z\$_][a-zA-Z\d_]*$/
// 需要查找的四个关键字
const keys = [ "'", '`', '${', '}' ]
const keysMatch = {
	"'": "'",
	'`': '`',
	'${': '}',
	'}': ''
}

export default function parseTemplate (template) {
	const scanner = new Scanner(template)
	const tokens = []
	let words
	let start
	// 当处理的字符串是html template模板时
	if (expression.test(template)) {
		while (!scanner.eos()) {
			start = scanner.pos
			words = scanner.scanUtil('{{')
			if (words && isChineseChar(words)) {
				tokens.push({
					type: 'text',
					text: words,
					start,
					end: scanner.pos
				})
			}
			scanner.scan('{{')
			start = scanner.pos
			words = scanner.scanUtil('}}')
			if (words && isChineseChar(words) && !words.includes('|')) {
				tokens.push({
					type: 'html-params',
					text: words,
					start,
					end: scanner.pos
				})
			}
			scanner.scan('}}')
		}
		return tokens
	}
	// 其他情况，寻找引号标签包裹的中文
	let token = ''
	let tokenpos = 0
	let exp = ''
	let exppos = 0
	let idx = 0
	let params = []
	const keywords = []
	// 查找关键字
	words = scanner.scanUtil(keys)
	// 没有查询到任何关键字或者关键字前包含中文，都按全段文字为中文处理
	if (!scanner.keyword || isChineseChar(words)) {
		const zhMatch = template.match(chinese)
		while (zhMatch && zhMatch.length) {
			const char = zhMatch.shift()
			start = template.indexOf(char)
			tokens.push({
				type: 'text',
				text: char,
				start,
				end: start + char.length
			})
		}
		return tokens
	}
	keywords.push(scanner.keyword)
	tokenpos = scanner.pos
	while (!scanner.eos()) {
		// 查找关键字
		scanner.scan()
		words = scanner.scanUtil(keys)
		if (words.slice(-1) === '\\') {
			if (!exppos) token += words + scanner.keyword
			else exp += words + scanner.keyword
			continue
		}
		if (!keywords.length && scanner.keyword) {
			// 匹配到开始标签，初始化数据
			const matchKey = keysMatch[scanner.keyword]
			matchKey && keywords.push(scanner.keyword)
			tokenpos = scanner.pos
			token = ''
			exp = ''
			exppos = 0
			params = []
			continue
		} else if (keywords.length) {
			if (!exppos) token += words
			else exp += words
			let last = keywords[keywords.length - 1]
			const matchKey = keysMatch[scanner.keyword]
			if (keysMatch[last] !== scanner.keyword) matchKey && keywords.push(scanner.keyword)
			else keywords.pop()
		}
		// 匹配到${，说明开始匹配模板变量
		if (!exppos && scanner.keyword === '${') {
			token += '{'
			exppos = scanner.pos + 2
			continue
		}
		// 匹配到模板变量结束
		if (scanner.keyword === '}' && keywords.every(item => item !== '${')) {
			if (exp) {
				const isSimple = vname.test(exp.trim())
				const name = isSimple ? exp : `value${idx++}`
				params.push({
					name,
					value: isSimple ? null : exp.trim()
				})
				exp = ''
				exppos = 0
				token += name + '}'
			} else {
				// 存在匹配完成之后剩余的 } 字符
				token += '}'
			}
		}
		// 匹配到标签闭合时：
		if (!keywords.length && token && isChineseChar(token)) {
			tokens.push({
				type: scanner.keyword === '`' ? 'template' : 'string',
				text: token,
				start: tokenpos,
				end: scanner.pos + scanner.keyword.length,
				params
			})
			token = ''
		}
		if (exppos) exp += scanner.keyword
	}
	return tokens
}
