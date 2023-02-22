import { Scanner } from './scanner'
import { isChineseChar, codeReplace } from './common'

const chinese = /\S*[^\x00-\xff]+\S*/g
const vname = /^[a-zA-Z\$_][a-zA-Z\d_]*$/
// 需要查找的关键字
const KEYWORD = ["'", '`', '{{', '}}', '${', '}', '"', '(', ')', '//', '/**', '*/', '\r\n', '\n', '\r']
const MATCH_KEYWORD = {
  "'": "'",
  '"': '"',
  '`': '`',
  '${': '}',
  '}': '',
  '(': ')',
  '{{': '}}',
  '//': ['\r\n', '\n', '\r'],
  '/**': '*/',
}

export function parseTemplate(template) {
  const scanner = new Scanner(template)
  const tokens = []
  const keywordStack = []
  let words
  let keyword
  let pos
  let matched
  let isExp = false
  let idx = 0
  let params = []
  let ignore = false
  // 查找关键字
  words = scanner.scanUtil(KEYWORD)
  // 没有查询到任何关键字或者关键字前包含中文，都按全段文字为中文处理
  if (!scanner.keyword || (isChineseChar(words) && scanner.keyword !== '{{')) {
    matchChinese(template, 0)
    return tokens
  }
  // 遍历字符串
  while (!scanner.eos()) {
    pos = scanner.pos
    keyword = scanner.keyword
    // 如果关键字前一个字符为转义符，则不是需要找的关键字，继续向后查询
    if (words.slice(-1) === '\\') {
      scanner.scan()
      scanner.scanUtil(KEYWORD)
      continue
    }
    // 需要忽略注释及console.log的中文
    if (['//', '/**'].includes(keyword) || (keyword === '(' && words.includes('console.log'))) {
      ignore = true
    }
    if (keyword === '${') {
      isExp = true
    }
    if (keyword === '{{' && isChineseChar(words)) {
      matchChinese(words, pos - words.length)
    }
    if (!ignore && ['\r\n', '\n', '\r'].includes(keyword) && isChineseChar(words) && keywordStack.every(item => item.keyword !== '`')) {
      matchChinese(words, pos - words.length)
    }
    matched = matchPairKeyword(keyword, pos)
    if (matched && !ignore) {
      const token = template.slice(matched.pos + matched.keyword.length, pos)
      const end = scanner.pos + keyword.length
      // 引号匹配时，引号包裹的部分是需要检验的目标
      if (["'", '"'].includes(matched.keyword) && isChineseChar(token) && !isExp) {
        tokens.push({
          type: 'string',
          text: token,
          start: matched.pos,
          end,
        })
      }
      // ES6模板语法匹配
      if (keyword === '`' && !isExp) {
        if (isChineseChar(token)) {
          const paramsTokens = params.map(item => {
            return {
              start: item.start - matched.pos - 1,
              end: item.end - matched.pos - 1,
              name: `{${item.name}}`,
            }
          })
          tokens.push({
            type: params.length ? 'template' : 'string',
            text: codeReplace(token, paramsTokens, item => item.name),
            start: matched.pos,
            end,
            params,
            origin: token,
          })
        }
        params = []
      }
      // ES6模板语法中的参数匹配
      if (keyword === '}') {
        const isSimple = vname.test(token.trim())
        const name = isSimple ? token : `value${idx++}`
        const value = isSimple ? null : token.trim()
        params.push({
          name,
          expression: value,
          start: matched.pos,
          end,
          tokens: isSimple ? [] : parseTemplate(value),
        })
      }
    }
    if (matched && [')', '*/', '\r\n'].includes(keyword)) {
      ignore = false
    }
    if (keywordStack.every(item => item.keyword !== '${')) {
      isExp = false
    }
    scanner.scan()
    words = scanner.scanUtil(KEYWORD)
  }
  // 匹配完之后有剩余的字符串也需要校验是否存在中文
  if (words && isChineseChar(words)) {
    matchChinese(words, scanner.pos - words.length)
  }
  return tokens

  function matchChinese(string, start) {
    const zhMatch = string.match(chinese)
    while (zhMatch && zhMatch.length) {
      const char = zhMatch.shift()
      start = start + string.indexOf(char)
      tokens.push({
        type: 'text',
        text: char,
        start,
        end: start + char.length,
      })
    }
  }

  function matchPairKeyword(keyword, pos) {
    const keyMatch = MATCH_KEYWORD[keyword]
    const len = keywordStack.length
    if (!len) {
      keyMatch &&
        keywordStack.push({
          keyword,
          pos,
        })
      return
    }
    const last = keywordStack[len - 1]
    const lastKeyMatch = MATCH_KEYWORD[last.keyword]
    if (
      (typeof lastKeyMatch === 'string' && lastKeyMatch !== keyword) ||
      (Array.isArray(lastKeyMatch) && lastKeyMatch.includes(keyword))
    ) {
      keyMatch &&
        keywordStack.push({
          keyword,
          pos,
        })
      return
    } else {
      return keywordStack.pop()
    }
  }
}
