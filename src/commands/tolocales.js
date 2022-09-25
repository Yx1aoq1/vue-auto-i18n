import fs from 'fs'
import path from 'path'
import xlsx from 'node-xlsx'
import { unflatten } from '../utils/common'
import { exportLocale } from '../utils/fs'
import { LocaleLoader } from '../localeLoader'
import { Global } from '../global'

export default function exceltojs (program) {
	program
		.command('tolocales <excelpath> [namespaces]')
		.description('读取excel生成对应的国际化语言包，传入<excelpath>导出位置，可指定只导出[namespaces]的几个表')
		.action(async (excelpath, namespaces = '') => {
			const regex = /^(?<namespace>\w+)\.(?<keypath>.+)$/
			const localeLoader = new LocaleLoader(process.cwd())
			await localeLoader.init()
			excelpath = path.resolve(process.cwd(), excelpath)
			// 验证目录存在
			try {
				fs.accessSync(excelpath, fs.constants.F_OK)
			} catch (error) {
				logger.error(`${excelpath}文件或目录不存在`)
				process.exit()
			}
			try {
				const sheets = xlsx.parse(fs.readFileSync(excelpath))
				if (namespaces) {
					namespaces = namespaces.split(',')
				}
				sheets.map(sheet => {
					const { name, data } = sheet
					const cols = data.shift()
					const [ keyCols, ...locales ] = cols
					if (!namespaces || namespaces.includes(name)) {
						data.map(item => {
							const [ key, ...trans ] = item
							let namespace
							let keypath = key
							let match = null
							if (Global.namespace) {
								match = regex.exec(key)
								if (!match || match.length < 1) return
								namespace = match.groups && match.groups.namespace
								keypath = match.groups && match.groups.keypath
							}
							trans.map((text, idx) => {
								if (locales[idx] !== Global.sourceLanguage) {
									localeLoader.write({
										key: keypath,
										text,
										namespace,
										locale: locales[idx]
									})
								}
							})
						})
					}
				})
				localeLoader.update()
				localeLoader.export()
			} catch (err) {
				logger.error(`解析excel文件失败`)
				process.exit()
			}
		})
}
