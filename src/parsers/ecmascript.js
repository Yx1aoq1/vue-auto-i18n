import { Parser } from './base'
import path from 'path'
import fs from 'fs'
import os from 'os'
import dayjs from 'dayjs'

const LanguageIds = {
	js: 'javascript',
	ts: 'typescript'
}

const LanguageExts = {
	js: 'm?js',
	ts: 'ts'
}

export class EcmascriptParser extends Parser {
	constructor (id) {
		super([ LanguageIds[id] ], LanguageExts[id])
		this.id = id
	}

	async parse () {
		return {}
	}

	async dump (object) {
		let raw = JSON.stringify(object, null, 2)
		raw = `export default ${raw}`
		raw = raw.replace(/\"([\w_-]*)\":/g, '$1:').replace(/:\s*\"(.*)\"/g, ": '$1'")
		return raw
	}

	async load (filepath) {
		const raw = fs.readFileSync(filepath, 'utf-8')
		const tempath = path.join(os.tmpdir(), `./temp_${dayjs().valueOf()}.js`)
		// 由于运行时不允许es6语法，只能替换一下再重新读取
		fs.writeFileSync(tempath, raw.replace('export default', 'exports.default ='), { flag: 'w' })
		const obj = require(tempath).default
		// 删除文件
		fs.unlinkSync(tempath)
		return obj
	}
}
