import fs from 'fs'
import path from 'path'
import xlsx from 'node-xlsx'
import { 
  isObject,
  getExtname,
  getFilenameWithoutExt,
  isChineseChar,
  flat
} from '../utils/common'
import { 
  ensureDirectoryExistence,
  readESModuleFile
} from '../utils/fs'

function generateExcelData (cfg, filename, languagePath) {
  const cols = ['key']
  const flatI18n = {}
  const execelCols = cfg.execelCols || DEFAULT_EXCEL_COLS
  const langs = Object.keys(languagePath)
  langs.map(lang => {
    cols.push(execelCols[lang])
    const filePath = path.resolve(languagePath[lang], filename)
    flatI18n[lang] = flat(readESModuleFile(filePath))
  })
  const data = [
    cols
  ]
  Object.keys(flatI18n['zh-cn'] || flatI18n[langs[0]]).map(key => {
    data.push(langs.reduce((res, lang) => {
      const value = flatI18n[lang][key]
      if(lang === 'zh-cn') {
        res.push(value)
      } else {
        res.push(isChineseChar(value) ? '': value)
      }
      return res
    }, [`${filename}.${key}`]))
  })
  return data
}



function getLanguagePaths (cfg) {
  const languages = cfg.languages || DEFAULT_LANGUAGES
  if (typeof cfg.languagePath === 'string') {
    return languages.reduce((paths, lang) => {
      paths[lang] = path.resolve(process.cwd(), cfg.languagePath, lang)
      return paths
    }, {})
  }
  if (isObject(cfg.languagePath)) {
    const languagePath = { ...cfg.languagePath }
    Object.keys(languagePath).map(lang => {
      languagePath[lang] = path.resolve(process.cwd(), languagePath[lang])
    })
    return languagePath
  }
  return {}
}

export default function toexcel (program) {
	program
    .command('toexcel [jspath]')
    .option('-n, --name <exportName>', '输出文件名称')
    .option('-d, --dir <exportDir>', '输出文件位置')
		.description('将i18n文件转成excel')
		.action((jspath = '', { exportName = 'translate', exportDir = './' }) => {
      const langPaths = getLanguagePaths(USER_CONFIG)
      const langs = Object.keys(langPaths)
      if (!jspath) {
        jspath = langPaths['zh-cn'] || langPaths[langs[0]]
      } else {
        jspath = path.resolve(process.cwd(), jspath)
      }
      // 验证目录存在
      try {
        fs.accessSync(jspath, fs.constants.F_OK)
      } catch (error) {
        error(`${jspath}文件或目录不存在`)
        process.exit()
      }
      // 导出execl
      const buildDatas = []
      const extname = getExtname(jspath)
      // 单文件处理
      if (extname === 'js') {
        const name = getFilenameWithoutExt(jspath)
        const data = generateExcelData(USER_CONFIG, name, {
          'zh-cn': jspath
        })
        buildDatas.push({
          name,
          data
        })
      } else {
        // 文件夹处理
        fs.readdirSync(jspath)
          .filter(filename => filename !== 'index.js' && filename.indexOf('.js') > -1)
          .forEach(filename => {
            const name = getFilenameWithoutExt(filename)
            const data = generateExcelData(USER_CONFIG, filename, {
              ...langPaths,
              'zh-cn': jspath
            })
            buildDatas.push({
              name,
              data
            })
          })
      }
      if (buildDatas.length) {
        const buffer = xlsx.build(buildDatas)
        const exportFilePath = path.join(exportDir, `${exportName}.xlsx`)
        // 确保目录存在
        ensureDirectoryExistence(exportFilePath)
        // 如果文件存在，覆盖
        fs.writeFileSync(exportFilePath, buffer, { flag: 'w' })
        logger.success('成功导出excel')
      } else {
        logger.warn('没有可以导出的内容')
      }
		})
}
