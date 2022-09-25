import fs from 'fs'
import { Global } from '../global'
import { Translator } from '../translator'
import { getExtname } from '../utils/common'
import { travelDir } from '../utils/fs'

export default function transalte (program) {
	program
		.command('translate <filepath> [namespace]')
		.description('对<filepath>文件进行中文提取并替换，提取至[namespace]文件中')
		.action(async (filepath, namespace) => {
			const translator = await Translator.create()
			// 验证目录存在
			try {
				fs.accessSync(filepath, fs.constants.F_OK)
			} catch (error) {
				logger.error(`${filepath}文件或目录不存在`)
				process.exit()
			}
			const extname = getExtname(filepath)
			// 单文件处理
			if (Global.enableTransExts.includes(extname)) {
				translator.translate(filepath, namespace, true)
				translator.getLocales(namespace)
			} else {
				// 文件夹处理
				travelDir(filepath, path => {
					const ext = getExtname(path)
					if (Global.enableTransExts.includes(ext)) {
						translator.translate(path, namespace, true)
						translator.getLocales(namespace)
					}
				})
			}
			logger.success('翻译已替换，请自行检查代码语法是否正确')
		})
}
