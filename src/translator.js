import fs from 'fs'
import { LocaleLoader } from './localeLoader'
import { getExtname } from './utils/common'
import { parseHTML } from './parseHTML'
import { isChineseChar } from './utils/common'
import { parseTemplate } from './parseTemplate'
import { cloneDeep } from 'lodash'
import * as vueCompiler from 'vue-template-compiler'
import Stringify from 'vue-sfc-descriptor-stringify'
export class Translator {
	static async create () {
		const localeLoader = new LocaleLoader(process.cwd())
		await localeLoader.init()
		return new Translator(localeLoader)
	}
	constructor (localeLoader) {
		this.localeLoader = localeLoader
	}
	/**
	 * 如果代码中包含 i18nIgnore 关键字，则该文件忽略国际化
	 * @param {*} code
	 */
	isIgnore (code) {
		return code.includes('i18nIgnore')
	}

	replace (origin, tokens, callback) {
		function splice (soure, start, end, replace) {
			return soure.slice(0, start) + replace + soure.slice(end)
		}
		let code = origin
		let offset = 0
		tokens.forEach(token => {
			code = splice(code, token.start + offset, token.end + offset, callback(token))
			offset = code.length - origin.length
			// console.log('code', code)
		})
		return code
	}

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
								tokens: parseTemplate(attr.value)
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
						tokens: parseTemplate(text)
					})
				}
			}
		})
		return tokens
	}

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
					origin: code
				}
			case 'vue':
				const originSfcDescriptor = vueCompiler.parseComponent(code)
				const sfcDescriptor = cloneDeep(originSfcDescriptor)
				const template = sfcDescriptor.template.content
				const script = sfcDescriptor.script.content
				return {
					extname,
					origin: code,
					template,
					script,
					tokens: [ this.parseHTML(template), this.parseECMAScript(script) ]
				}
			case 'js':
			case 'ts':
				return {
					extname,
					tokens: this.parseECMAScript(code),
					origin: code
				}
			default:
				return
		}
	}

	translate (filepath, namespace) {
		const { extname, tokens, origin, template, script } = this.parse(filepath)
		function handleToken (token, isHTMLChars = false, isVue = false) {
			let value
			const params = (token.params || []).map(item => ({
				name: item.name,
				value: item.expression && this.replace(item.expression, item.tokens, t => handleToken(t, false, isVue))
			}))
			switch (token.type) {
				// 由div包裹的纯文本
				case 'chars':
					value = this.replace(token.text, token.tokens, t => handleToken(t, true, isVue))
					return value
				case 'text':
					return this.stringToIdentifier(namespace, token.text, params, isHTMLChars, isVue)
				case 'attribute':
					value = this.replace(token.value, token.tokens, t => handleToken(t, false, isVue))
					if (isVueScript) return `${token.name[0] === ':' ? '' : ':'}${token.name}="${value}"`
				case 'string':
				case 'template':
			}
		}
		if (extname === 'vue') {
			const newTemplate = this.replace(template, tokens[0], t => handleToken(t))
			const newScript = this.replace(template, tokens[1], t => handleToken(t, false, true))
		} else {
			const newCode = this.replace(origin, tokens, t => handleToken(t))
		}
	}
}
