import { Parser } from 'acorn'
import { isChineseChar, splice, once } from './utils/common'

export default function (code, languageUtils, exportName, isVue = true) {

  function codeReplace (start, end, replace) {
    code = splice(code, start + offset, end + offset, replace)
    offset = code.length - origin.length
  }

  function handleReplaceChineseChar (start, end, text) {
    const identifier = languageUtils.stringToIdentifier(exportName, text)
    let value
    if (isVue && start > exportLocation) {
      value = `this.${identifier}`
    } else {
      value = `i18n.${identifier.substring(1)}`
      USER_CONFIG.importI18nFunction && importI18nFun(USER_CONFIG.importI18nFunction)
    }
    codeReplace(start, end, value)
  }

  const importI18nFun = once((importFun) => {
    const start = isVue ? 2 : 0 // vue 文件中首个字符通常为换行
    code = splice(code, start, start, `${importFun}\r\n`)
    offset = code.length - origin.length
  })

  const origin = code
  let tokens = [...Parser.tokenizer(origin)]
  let exportLocation
  let offset = 0
  while (tokens.length) {
    const token = tokens.shift()
    if (token.type.label === 'export') {
      exportLocation = token.start
    }
    if (token.type.label === 'string' && isChineseChar(token.value)) {
      handleReplaceChineseChar(token.start, token.end, token.value)
    }
    if (token.type.label === '`') {
      const endTokenIdx = tokens.findIndex(item => item.type.label === '`')
      const start = token.start
      const end = tokens[endTokenIdx].start
      const text = origin.substring(start, end)
      handleReplaceChineseChar(start, end, text)
      tokens = tokens.slice(endTokenIdx + 1)
    }
    // 跳过console.log的国际化
    if (token.type.label === 'name' && token.value === 'console') {
      const leftBracketIdx = tokens.findIndex(item => item.type.label === '(')
      const stack = [leftBracketIdx]
      let curToken, index = leftBracketIdx + 1
      while (stack.length) {
        curToken = tokens[index++]
        if (curToken.type.label === ')') {
          stack.pop()
        }
        if (curToken.type.label === '(') {
          stack.push(index)
        }
      }
      tokens = tokens.slice(index)
    }
  }
  return code
}