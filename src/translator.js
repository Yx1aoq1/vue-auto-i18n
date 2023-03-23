import fs from 'fs'
import { LocaleLoader } from './localeLoader'
import { getExtname, codeReplace } from './utils/common'
import { parseHTML } from './utils/parseHTML'
import { isChineseChar } from './utils/common'
import { parseTemplate } from './utils/parseTemplate'
import { cloneDeep } from 'lodash'
import * as vueCompiler from 'vue-template-compiler'
import Stringify from 'vue-sfc-descriptor-stringify'
import { Global } from './global'
import { exportFile } from './utils/fs'
export class Translator {
  static async create () {
    const localeLoader = new LocaleLoader(process.cwd())
    await localeLoader.init()
    return new Translator(localeLoader)
  }
  constructor(localeLoader) {
    this.localeLoader = localeLoader
  }
  /**
   * 如果代码中包含 i18nIgnore 关键字，则该文件忽略国际化
   * @param {*} code
   */
  isIgnore (code) {
    return code.includes('i18nIgnore')
  }
  /**
   * 解析html
   * @param {*} html
   * @returns
   */
  parseHTML (html) {
    const tokens = []
    parseHTML(html, {
      expectHTML: true,
      shouldKeepComment: false,
      start (tag, attrs, unary, start, end) {
        if (attrs && attrs.length) {
          attrs.map(attr => {
            if (isChineseChar(attr.value)) {
              tokens.push({
                type: 'attribute',
                ...attr,
                tokens: parseTemplate(attr.value),
              })
            }
          })
        }
      },
      chars (text, start, end) {
        if (isChineseChar(text)) {
          tokens.push({
            type: 'chars',
            text,
            start,
            end,
            tokens: parseTemplate(text),
          })
        }
      },
    })
    return tokens
  }
  /**
   * 解析script
   * @param {*} html
   * @returns
   */
  parseECMAScript (code) {
    return parseTemplate(code)
  }

  parse (filepath) {
    const extname = getExtname(filepath)
    const code = fs.readFileSync(filepath, 'utf-8')
    if (this.isIgnore(code)) return
    switch (extname) {
      case 'html':
        return {
          extname,
          tokens: this.parseHTML(code),
          origin: code,
        }
      case 'vue':
        const originSfcDescriptor = vueCompiler.parseComponent(code)
        const sfcDescriptor = cloneDeep(originSfcDescriptor)
        const template = sfcDescriptor.template.content
        // 兼容setup语法
        const script = (sfcDescriptor.script || sfcDescriptor.scriptSetup).content
        return {
          extname,
          originSfcDescriptor,
          sfcDescriptor,
          tokens: [this.parseHTML(template), this.parseECMAScript(script)],
        }
      case 'js':
      case 'ts':
        return {
          extname,
          tokens: this.parseECMAScript(code),
          origin: code,
        }
      default:
        return
    }
  }

  translate (filepath, namespace, replace = false) {
    const { extname, tokens, origin, originSfcDescriptor, sfcDescriptor } = this.parse(filepath)
    const _self = this
    function handleToken (token, type = '') {
      let value
      const params = (token.params || []).map(item => ({
        name: item.name,
        value: item.expression && codeReplace(item.expression, item.tokens, t => handleToken(t, 'template')),
      }))
      switch (token.type) {
        // 由div包裹的纯文本
        case 'chars':
          value = codeReplace(token.text, token.tokens, t => handleToken(t, t.type))
          break
        case 'attribute':
          value = codeReplace(token.value, token.tokens, t => handleToken(t, 'attribute'))
          if (type === 'vueTemplate') {
            value = `${token.name[0] === ':' ? '' : ':'}${token.name}="${value}"`
          }
          if (type === 'html' && Global.translateMode === 'angular') {
            value = `${token.name[0] === '[' ? token.name : `[${token.name}]`}="${value}"`
          }
          break
        case 'string':
        case 'text':
        case 'template':
          value = _self.stringToIdentifier(token.text, namespace, params, type)
          break
      }
      return value
    }
    let newCode
    switch (extname) {
      case 'html':
        newCode = codeReplace(origin, tokens, t => handleToken(t, 'html'))
        break
      case 'vue':
        sfcDescriptor.template.content = codeReplace(sfcDescriptor.template.content, tokens[0], t =>
          handleToken(t, 'vueTemplate')
        )
        if (sfcDescriptor.script) {
          sfcDescriptor.script.content = codeReplace(sfcDescriptor.script.content, tokens[1], t =>
            handleToken(t, 'vueScript')
          )
        }
        if (sfcDescriptor.scriptSetup) {
          sfcDescriptor.scriptSetup.content = codeReplace(sfcDescriptor.scriptSetup.content, tokens[1], t =>
            handleToken(t, 'script')
          )
        }
        newCode = Stringify(sfcDescriptor, originSfcDescriptor)
        break
      case 'js':
      case 'ts':
        newCode = codeReplace(origin, tokens, t => handleToken(t, 'script'))
        break
      default:
        return
    }
    replace && exportFile(filepath, newCode, { flag: 'w' })
  }

  stringToIdentifier (text, namespace, params, type) {
    const localeKey = this.localeLoader.findMatchLocaleKey(text, namespace)
    logger.info(`replace: ${text} --> ${localeKey}`)
    const param = params
      .map(item => {
        if (!item.value) return item.name
        return `${item.name}: ${item.value}`
      })
      .join(', ')
    if (Global.stringToIdentifier && typeof Global.stringToIdentifier === 'function') {
      return Global.stringToIdentifier.call(this, text, namespace, params, type)
    }
    if (Global.translateMode === 'vue') {
      const identifier = params.length ? `$t('${localeKey}', {${param}})` : `$t('${localeKey}')`
      if (['vueTemplate', 'text', 'chars'].includes(type)) {
        return `{{ ${identifier} }}`
      }
      if (type === 'vueScript') {
        return `this.${identifier}`
      }
      if (type === 'script') {
        return `i18n.${identifier.substring(1)}`
      }
      return identifier
    }
    if (Global.translateMode === 'angular') {
      const identifier = `'${localeKey}'`
      if (['text', 'chars'].includes(type)) {
        return params.length ? `{{ ${identifier} | translate: {${param}} }}` : `{{ ${identifier} | translate }}`
      }
      if (type === 'script') {
        return params.length
          ? `this.translate.instance(${identifier}, {${param}})`
          : `this.translate.instance(${identifier})`
      }
      return params.length ? `(${identifier} | translate: {${param}})` : `(${identifier} | translate)`
    }
    logger.info('\n⚠ stringToIdentifier undefined.')
    return text
  }

  async getLocales (namespace) {
    await this.localeLoader.export(namespace)
  }
}
