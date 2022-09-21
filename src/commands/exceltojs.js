import fs from 'fs'
import path from 'path'
import xlsx from 'node-xlsx'
import { unflatten } from '../utils/common'
import { exportLocale } from '../utils/fs'

function findExcelColLang(cfg, name) {
  const execelCols = cfg.execelCols || DEFAULT_EXCEL_COLS
  return Object.keys(execelCols).find(key => execelCols[key] === name)
}

function parseExcelDatas(data) {
  return data.shift().reduce((res, name, idx) => {
    if (name !== 'key') {
      const lang = findExcelColLang(Config, name) || `unknow_${idx}`
      res[lang] = unflatten(
        data.reduce((target, item) => {
          const key = item[0]
          target[key] = item[idx]
          return target
        }, {})
      )
    }
    return res
  }, {})
}

function generateJSFromSheets(basePath, data) {
  data.map(cur => {
    const result = parseExcelDatas(cur.data)
    Object.keys(result).map(lang => {
      const exportFilePath = path.resolve(basePath, lang, cur.name)
      // 如果文件存在，覆盖
      exportLocale(exportFilePath, result[lang][cur.name])
    })
  })
}

export default function exceltojs(program) {
  program
    .command('exceltojs <excelpath>')
    .description('根据excel的翻译生成对应的国际化语言包(.js文件)')
    .action(excelpath => {
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
        const basePath = path.resolve(process.cwd(), Config.outputLanguagePath || DEFAULT_OUTPUT_PATH)
        generateJSFromSheets(basePath, sheets)
        logger.success(`解析excel文件成功，已导出文件至目录${basePath}`)
      } catch (err) {
        logger.error(`解析excel文件失败`)
        process.exit()
      }
    })
}
