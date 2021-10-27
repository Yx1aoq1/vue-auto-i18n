import fs from 'fs'
import os from 'os'
import path from 'path'
import xlsx from 'node-xlsx'
import { getExtname, getFilenameWithoutExt, isChineseChar, flat } from '../utils'

function readESModuleFile (filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const tempPath = path.join(os.tmpdir(), `./temp${+new Date()}.js`)
  // 由于运行时不允许es6语法，只能替换一下再重新读取
  fs.writeFileSync(tempPath, content.replace('export default', 'exports.default ='), { flag: 'w' })
  const i18n = require(tempPath).default
  // 删除文件
  fs.unlinkSync(tempPath)
  return i18n
}

function generateExcelData (zhPath, enPath, filename) {
  const flatZhI18n = flat(readESModuleFile(zhPath))
  const flatEnI18n = enPath ? flat(readESModuleFile(enPath) || {}) : {}
  const data = [
    ['key', '中文', '英文翻译']
  ]
  Object.keys(flatZhI18n).map(key => {
    const zh = flatZhI18n[key]
    const en = flatEnI18n[key] || ''
    // key拼接文件名称
    data.push([`${filename}.${key}`, zh, isChineseChar(en) ? '' : en])
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
    .option('-t, --translate <translatePath>', '已翻译好的i18n文件，将翻译填充进excel')
		.description('将i18n文件转成excel')
		.action((jspath, exportName = 'translate', exportPath = '', { translate }) => {
      const zhPath = path.join(process.cwd(), jspath)
      const enPath = translate ? path.join(process.cwd(), translate) : null
      fs.access(zhPath, fs.constants.F_OK, (err) => {
        if (err) {
          console.error(`${zhPath}文件或目录不存在`)
          process.exit()
        } else {
          const buildDatas = []
          const extname = getExtname(zhPath)
          // 单文件处理
          if (extname === 'js') {
            const name = getFilenameWithoutExt(zhPath)
            const data = generateExcelData(zhPath, enPath, name)
            buildDatas.push({
              name,
              data
            })
          } else {
            // 文件夹处理
            fs.readdirSync(zhPath)
              .filter(filename => filename !== 'index.js' && filename.indexOf('.js') > -1)
              .forEach(filename => {
                const zhFilePath = path.join(zhPath, './' + filename)
                const enFilePath = enPath ? path.join(enPath, './' + filename) : null
                const name = getFilenameWithoutExt(filename)
                const data = generateExcelData(zhFilePath, enFilePath, name)
                buildDatas.push({
                  name: filename,
                  data
                })
              })
          }
          
          if (buildDatas.length) {
            const buffer = xlsx.build(buildDatas)
            const exportFilePath = path.join(exportPath, `${exportName}.xlsx`)
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
