import fs from 'fs'
import path from 'path'
import LanguageUtils from '../language'
import { getExtname, isChineseChar, makeMap } from '../utils/common'
import * as vueCompiler from 'vue-template-compiler'

const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const ncname = '[a-zA-Z_][\\w\\-\\.]*'
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)
const startTagClose = /^\s*(\/?)>/
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const comment = /^<!\--/
const chinese = /[^\x00-\xff]+.*/g
const quote = /\'(.*?)\'|\"(.*?)\"|\`(.*?)\`/g
const variable = /\$?\{?\{([a-zA-Z][a-zA-Z\d]*)\}?\}/g
let IS_REGEX_CAPTURING_BROKEN = false
'x'.replace(/x(.)?/g, function (m, g) {
  IS_REGEX_CAPTURING_BROKEN = g === ''
})
const isPlainTextElement = makeMap('script,style,textarea', true)
const decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t'
}
const encodedAttr = /&(?:lt|gt|quot|amp);/g
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#10|#9);/g
const isIgnoreNewlineTag = makeMap('pre,textarea', true)
const shouldIgnoreFirstNewline = (tag, html) => tag && isIgnoreNewlineTag(tag) && html[0] === '\n'

function handleVueCode (code, languageUtils, exportName) {
  const sfcDescriptor = vueCompiler.parseComponent(code)
  sfcDescriptor.template.content = handleTemplateCode(sfcDescriptor.template.content, languageUtils, exportName)
  sfcDescriptor.script.content = handleJavaScriptCode(sfcDescriptor.script.content, languageUtils, exportName)
  
  return handleSFCtoCode(sfcDescriptor)
}

function handleTemplateCode (code, languageUtils, exportName) {
  // 该文件代码是否忽略国际化
  if (isIgnore(code)) {
    return code
  }
  const origin = code
  let index = 0
  let offset = 0
  let html = code
  let lastTag
  while (html) {
    let textEnd = html.indexOf('<')
    if (textEnd === 0) {
      // Comment:
      if (comment.test(html)) {
        const commentEnd = html.indexOf('-->')
        if (commentEnd >= 0) {
          advance(commentEnd + 3)
          continue
        }
      }
      // End tag:
      const endTagMatch = html.match(endTag)
      if (endTagMatch) {
        advance(endTagMatch[0].length)
        continue
      }
      // Start tag:
      const startTagMatch = parseStartTag()
      if (startTagMatch) {
        handleStartTag(startTagMatch)
        if (shouldIgnoreFirstNewline(lastTag, html)) {
          // pre、textarea 标签内，忽略首个 \n
          advance(1)
        }
        continue
      }
    }
    // 若是不能匹配，则获取文本
    let text, rest, next
    if (textEnd >= 0) {
      rest = html.slice(textEnd)
      // 查找到第一个能解析出来的 <，从 0 ~ 这个能解析出来的 < 字符之间的内容都是文本（有可能找不到能解析的 <）
      while (
        !endTag.test(rest) &&
        !startTagOpen.test(rest) &&
        !comment.test(rest)
      ) {
        // 若 html 里只有一个 <
        next = rest.indexOf('<', 1)
        if (next < 0) break

        // 若 html 里有至少两个 <
        textEnd += next
        rest = html.slice(textEnd)
      }
      // while 循环结束时，textEnd 为 html 里最后一个不能解析为 结束标签/开始标签的前部/注释标签/条件注释标签 的 < 的位置
      // 即 textEnd 之前的部分都将成为文本
      text = html.substring(0, textEnd)
      // 判断是否有中文字符，替换中文字符
      if (isChineseChar(text)) {
        handleReplaceChineseChar(text, index, index + textEnd)
      }
      advance(textEnd)
    }
    // 若 html 里没有 <，则整个 html 都为文本
    if (textEnd < 0) {
      text = html
      // 判断是否有中文字符，替换中文字符
      if (isChineseChar(text)) {
        handleReplaceChineseChar(text, 0, text.length)
      }
      html = ''
    }
  }

  
  /**
   * 截取 html 模板，并设置当前 html 模板的开始位置位于最初 html 模板里的位置
   */
   function advance (n) {
    index += n
    html = html.substring(n)
  }

  /**
   * 解析开始标签，返回结果对象
   * {
   *   tagName, 标签名
   *   attrs, 特性匹配数组
   *   start, 开始标签在 template 里的开始位置
   *   end, （可选）开始标签在 template 里的结束位置
   *   unarySlash, 一元标签的 /
   * }
   */
  function parseStartTag () {
    const start = html.match(startTagOpen)
    if(start) {
      const match = {
        tagName: start[1],
        attrs: [],
        start: index
      }
      advance(start[0].length)
      let end, attr
      // 没匹配到开始标签的关闭 && 匹配到特性
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length)
        match.attrs.push(attr)
      }
      if (end) {
        // 一元标签的 slash
        match.unarySlash = end[1]
        advance(end[0].length)
        match.end = index
        return match
      }
    }
  }

  function handleStartTag (match) {
    const tagName = match.tagName
    const unarySlash = match.unarySlash
    const unary = !!unarySlash

    let text = origin.substring(match.start, match.end)
    let start = match.start
    const l = match.attrs.length
    for (let i = 0; i < l; i++) {
      const args = match.attrs[i]
      if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
        if (args[3] === '') { delete args[3] }
        if (args[4] === '') { delete args[4] }
        if (args[5] === '') { delete args[5] }
      }
      // 特性的名称与值
      const name = args[1]
      const value = args[3] || args[4] || args[5] || ''
      // 判断是否有中文字符，替换中文字符
      if (value && isChineseChar(value)) {
        if (!name.includes(':')) {
          const attrNameStart = start + text.indexOf(name)
          const attrNameEnd = attrNameStart + name.length
          codeReplace(attrNameStart, attrNameEnd, `:${name}`)
        }
        const attrValueStart = start + text.indexOf(value)
        const attrValueEnd = attrValueStart + value.length
        handleReplaceChineseChar(value, attrValueStart, attrValueEnd, true)
      }
      const offset = text.indexOf(args[0]) + args[0].length
      text = text.substring(offset)
      start += offset
    }

    // 非一元标签，更新 lastTag
    if (!unary) {
      lastTag = tagName
    }
  }

  function handleReplaceChineseChar (text, start, end, isAttr = false) {
    // 当字符为：`xxxx`格式
    if (/\`(.*)\`/.test(text)) {
      codeReplace(start, end, stringLiteralToIdentifier(text))
      return
    }
    // 当字符为 {} 格式
    if (/\{(.*)\}/.test(text) && !/\{\{(.*)\}\}/.test(text)) {
      return
    }
    // 当字符为 [] 格式
    if (/\[(.*)\]/.test(text)) {
      return
    }
    // 其他字符串格式
    const zhMatch = text.match(chinese)
    while (zhMatch && zhMatch.length) {
      const char = zhMatch.shift()
      const charStart = start + text.indexOf(char)
      const charEnd = charStart + char.length
      codeReplace(charStart, charEnd, isAttr ? stringLiteralToIdentifier(char) : `{{ ${stringLiteralToIdentifier(char)} }}`)
    }
  }

  function codeReplace (start, end, replace) {
    code = splice(code, start + offset, end + offset, replace)
    offset = code.length - origin.length
    console.log('code:', code)
  }

  function stringLiteralToIdentifier (text) {
    const variableMatch = variable.exec(text)
    const key = languageUtils.findKey(exportName, text.replace(variable, '{$1}'))
    return !!variableMatch ? `$t('${key}', { ${variableMatch[1]} })` : `$t('${key}')`
  }
}

function handleJavaScriptCode (code, languageUtils, exportName, isVue = true) {
  // 该文件代码是否忽略国际化
  if (isIgnore(code)) {
    return code
  }
}

function handleSFCtoCode (sfcDescriptor) {

}

/**
 * 如果代码中包含 i18nIgnore 关键字，则该文件忽略国际化
 * @param {*} code
 */
function isIgnore(code) {
  return code.includes('i18nIgnore')
}

/**
 * 将文本start-end处的文本替换为replace
 * @param {*} soure 
 * @param {*} start 
 * @param {*} end 
 * @param {*} replace 
 * @returns 
 */
function splice (soure, start, end, replace) {
  return soure.slice(0, start) + replace + soure.slice(end)
}

export default function transalte (program) {
  program
    .command('translate <filepath> <exportName> [lang]')
    .description('对<filepath>文件进行中文提取，提取至<exportName>文件中')
    .action((filepath, exportName, lang = 'zh-cn') => {
      const languageUtils = new LanguageUtils(lang)
      // 验证目录存在
			try {
        fs.accessSync(filepath, fs.constants.F_OK)
      } catch (error) {
        logger.error(`${filepath}文件或目录不存在`)
        process.exit()
      }
      const extname = getExtname(filepath)
      // vue单文件处理
			if (extname === 'vue') {
        const code = fs.readFileSync(filepath, 'utf-8')
        const newCode = handleVueCode(code, languageUtils, exportName)
        console.log(newCode)
			}
    })
}