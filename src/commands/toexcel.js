import fs from 'fs'
import path from 'path'
import xlsx from 'node-xlsx'
/**
 * 对象扁平化处理
 * @param {*} obj 
 * @param {*} key 
 * @param {*} res 
 * @param {*} isArray 
 */
function flat (obj, key = '', res = {}, isArray = false) {
	for (let [ k, v ] of Object.entries(obj)) {
		if (Array.isArray(v)) {
			let tmp = isArray ? key + '[' + k + ']' : key + k
			flat(v, tmp, res, true)
		} else if (typeof v === 'object') {
			let tmp = isArray ? key + '[' + k + '].' : key + k + '.'
			flat(v, tmp, res)
		} else {
			let tmp = isArray ? key + '[' + k + ']' : key + k
			res[tmp] = v
		}
	}
	return res
}

export default function toexcel (program) {
	program
		.command('toexcel <jspath>')
		.description('将i18n文件转成excel')
		.option('-f, --filename <filename>', '指定导出的excel文件名')
		.option('-d, --dir <path>', '指定导出的excel保存位置')
		.action((jspath, options) => {
      const fullPath = path.join(process.cwd(), jspath)
      fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
          console.error(`${fullPath}文件不存在`)
          process.exit()
        } else {
          const i18n = require(fullPath).default
          const flatI18n = flat(i18n)
          const excelData = [
            ['key', '中文', '英文翻译']
          ]
          Object.keys(flatI18n).map(key => {
            const value = flatI18n[key]
            excelData.push([key, value])
          })

          const buffer = xlsx.build([
            {
              name: 'sheet1',
              data: excelData
            }
          ])
          // 如果文件存在，覆盖
          fs.writeFileSync('test.xlsx', buffer, { flag: 'w' })
        }
      })
		})
}
