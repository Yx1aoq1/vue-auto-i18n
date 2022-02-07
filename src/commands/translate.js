import fs from 'fs'
import path from 'path'
import LanguageUtils from '../language'
import { getExtname, isChineseChar } from '../utils/common'
import { CHINESE_REG, VARIABLE_REG, QUOTE_REG } from '../utils/regex'
import * as vueCompiler from 'vue-template-compiler'

const ncname = '[a-zA-Z_][\\w\\-\\.]*';
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`);
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const startTagClose = /^\s*(\/?)>/;
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);

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
  function advance (n) {
    index += n
    html = html.substring(n)
    console.log('index:', index)
    console.log(html)
  }
  let index = 0
  let html = code
  // lastTag 是上一个已经处理完开始标签，但是还没处理结束标签的元素
  let last, lastTag
  while (html) {
    last = html
    if (!lastTag) {
      let textEnd = html.indexOf('<')

      
    }
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
 * 字符串转为变量
 * @param {*} node
 * @param {*} text
 */
function chineseCharReplace(text, i18nMap, exportName) {
  const matchs = text.match(CHINESE_REG)
  while (matchs && matchs.length) {
    const cur = matchs.pop()
    const curMatchs = VARIABLE_REG.exec(cur)
    let str, value
    if (curMatchs) {
      // 判断是否带参数
      value = curMatchs[1]
      str = cur.replace(VARIABLE_REG, '{$1}')
    } else {
      str = cur
    }
    const key = findI18nKey(i18nMap, exportName, str)
    const identifier = value ? `$t('${key}', { ${value} })` : `$t('${key}')`
    text = text.replace(cur, identifier)
  }
  // 去掉引号
  text = text.replace(QUOTE_REG, '$1$2$3')
  console.log(text)
  return text
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