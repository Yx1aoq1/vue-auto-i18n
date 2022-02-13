import Scanner from './scanner'
import { isChineseChar } from './utils/common'

const chinese = /[^\x00-\xff]+.*/g
const vname = /^[a-zA-Z\$_][a-zA-Z\d_]*$/
// 需要查找的关键字
const KEYWORD = [ "'", '`', '{{', '}}', '${', '}', '"', '(', ')', '//', '/**', '*/', '\r\n' ]
const QUOTE = [ "'", '"', '`' ]
const MATCH_KEYWORD = {
	"'": "'",
	'"': '"',
	'`': '`',
	'${': '}',
	'}': '',
	'(': ')',
	'{{': '}}',
	'//': '\r\n',
	'/**': '*/'
}

export default function parseTemplate (template) {
	const scanner = new Scanner(template)
	const tokens = []
	const keywordStack = []
	let words
	let keyword
	let start
	let status
	let token = ''
	let tokenpos = 0
	let exp = ''
	let idx = 0
	let params = []
	let ignore = false
	// 查找关键字
	words = scanner.scanUtil(KEYWORD)
	start = scanner.pos
	keyword = scanner.keyword
	// 没有查询到任何关键字或者关键字前包含中文，都按全段文字为中文处理
	if (!keyword || (isChineseChar(words) && keyword !== '{{')) {
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

	while (!scanner.eos()) {
		start = scanner.pos
		keyword = scanner.keyword
		status = updateKeywordStack(keyword)
		if (!token) {
			tokenpos = start
		}
		// 需要忽略注释及console.log的中文
		if ([ '//', '/**' ].includes(keyword)) {
			ignore = true
		}
		// 如果关键字前一个字符为转义符，则不是需要找的关键字，继续向后查询
		if (token.slice(-1) === '\\') {
			scanner.scan()
			token += scanner.keyword + scanner.scanUtil(KEYWORD)
			continue
		}
		// 匹配到ES6模板语法的参数起始，开始记录参数
		if (keyword === '${' && !exp) {
			token += '{'
			scanner.scan()
			exp = scanner.scanUtil(KEYWORD)
			continue
		}
		// 匹配到vue的模板语法
		if (keyword === '{{' && words && isChineseChar(words)) {
			tokens.push({
				type: 'text',
				text: words,
				start: start - words.length,
				end: start
			})
			scanner.scan()
			tokenpos = scanner.pos
			token = scanner.scanUtil('}}')
			continue
		}
		// 不是在引号内部的不处理
		if (keyword === '(' && !isKeywordsInStack(QUOTE)) {
			ignore = words.includes('console.log')
			scanner.scan()
			scanner.scanUtil(KEYWORD)
			continue
		}
		// 匹配到引号起始位置
		if (QUOTE.includes(keyword) && status === 'start' && !isKeywordsInStack(QUOTE, 0, keywordStack.length - 1)) {
			tokenpos = scanner.pos
			scanner.scan()
			words = scanner.scanUtil(KEYWORD)
			token = words
			continue
		}
		// 匹配到结束关键字
		if (status === 'end') {
			if (keyword === '}' && exp && !isKeywordsInStack('${')) {
				const isSimple = vname.test(exp.trim())
				const name = isSimple ? exp : `value${idx++}`
				params.push({
					name,
					value: isSimple ? null : exp.trim()
				})
				exp = ''
				token += name
			}
			if (!ignore && token && isChineseChar(token) && !isKeywordsInStack(QUOTE)) {
				const type = params.length ? 'template' : keyword === '}}' ? 'param' : 'string'
				tokens.push({
					type,
					text: token,
					start: tokenpos,
					end: scanner.pos + ((type !== 'param' && 1) || 0),
					...(type === 'template' && { params })
				})
				token = ''
				tokenpos = 0
			}
			if ([ ')', '\r\n', '*/' ].includes(keyword)) {
				ignore = false
			}
		}
		scanner.scan()
		words = scanner.scanUtil(KEYWORD)
		if (!ignore) {
			if (exp) {
				exp += keyword + words
			} else {
				token += keyword + words
			}
		}
	}
	return tokens

	function updateKeywordStack (keyword) {
		const keyMatch = MATCH_KEYWORD[keyword]
		const len = keywordStack.length
		if (!len) {
			keyMatch && keywordStack.push(keyword)
			return 'start'
		}
		const last = keywordStack[len - 1]
		if (MATCH_KEYWORD[last] !== keyword) {
			keyMatch && keywordStack.push(keyword)
			return 'start'
		} else {
			keywordStack.pop()
			return 'end'
		}
	}
	function isKeywordsInStack (keywords, start = 0, end = keywordStack.length) {
		if (typeof keywords === 'string') {
			keywords = [ keywords ]
		}
		const stack = keywordStack.slice(start, end)
		return stack.some(item => keywords.includes(item))
	}
}
