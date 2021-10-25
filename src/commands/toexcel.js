import fs from 'fs'
import os from 'os'
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

function getExtname (path) {
  const files = path.split(/\/|\\/)
  const filename = files.length ? files[files.length - 1] : ''
  const filenameWithoutSuffix = filename.split(/#|\?/)[0]
  const extname = (/[^./\\]*$/.exec(filenameWithoutSuffix) || [''])[0]
  return {
    name: filenameWithoutSuffix.split('.')[0],
    extname
  }
}

function readESModuleFile (filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const tempPath = path.join(os.tmpdir(), './temp.js')
  // 由于运行时不允许es6语法，只能替换一下再重新读取
  fs.writeFileSync(tempPath, content.replace('export default', 'exports.default ='), { flag: 'w' })
  const i18n = require(tempPath).default
  // 删除文件
  fs.unlinkSync(tempPath)
  return i18n
}

function generateExcelData (filePath, filename) {
  const i18n = readESModuleFile(filePath)
  const flatI18n = flat(i18n)
  const data = [
    ['key', '中文', '英文翻译']
  ]
  Object.keys(flatI18n).map(key => {
    const value = flatI18n[key]
    // key拼接文件名称
    data.push([`${filename}.${key}`, value])
  })
  return data
}

function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  ensureDirectoryExistence(dirname)
  fs.mkdirSync(dirname)
}

export default function toexcel (program) {
	program
		.command('toexcel <jspath> [filename] [path]')
		.description('将i18n文件转成excel')
		.action((jspath, exportName, exportPath) => {
      const fullPath = path.join(process.cwd(), jspath)
      fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
          console.error(`${fullPath}文件或目录不存在`)
          process.exit()
        } else {
          const buildDatas = []
          const { name, extname } = getExtname(fullPath)
          // 单文件处理
          if (extname === 'js') {
            const data = generateExcelData(fullPath, name)
            buildDatas.push({
              name,
              data
            })
          } else {
            // 文件夹处理
            fs.readdirSync(fullPath)
              .filter(filename => filename !== 'index.js' && filename.indexOf('.js') > -1)
              .forEach(filename => {
                const filePath = path.join(fullPath, './' + filename)
                const { name } = getExtname(filename)
                const data = generateExcelData(filePath, name)
                buildDatas.push({
                  name: filename,
                  data
                })
              })
          }
          
          if (buildDatas.length) {
            const buffer = xlsx.build(buildDatas)
            const exportFilePath = path.join(exportPath || '', `${exportName || 'translate'}.xlsx`)
            // 确保目录存在
            ensureDirectoryExistence(exportFilePath)
            // 如果文件存在，覆盖
            fs.writeFileSync(exportFilePath, buffer, { flag: 'w' })
            console.log('成功导出excel')
          } else {
            console.error('没有可以导出的内容')
          }
        }
      })
		})
}
