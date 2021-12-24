import fs from 'fs'
import path from 'path'
import xlsx from 'node-xlsx'
import { 
  isObject,
  getExtname,
  getFilenameWithoutExt,
  isChineseChar,
  flatten
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
    flatI18n[lang] = flatten(readESModuleFile(languagePath[lang]))
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

function initLanguagePaths (cfg) {
  // 配置单个目录时：
  if (typeof cfg.languagePath === 'string') {
    const languages = cfg.languages || DEFAULT_LANGUAGES
    return languages.reduce((paths, lang) => {
      paths[lang] = path.resolve(process.cwd(), cfg.languagePath, lang)
      return paths
    }, {})
  }
  // 配置多个目录时：
  if (isObject(cfg.languagePath)) {
    return Object.keys(cfg.languagePath).reduce((target, lang) => {
      target[lang] = path.resolve(process.cwd(), cfg.languagePath[lang])
      return target
    }, {})
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
      let filepath
      const langPaths = initLanguagePaths(USER_CONFIG)
      const langs = Object.keys(langPaths)
      if (!jspath) {
        filepath = langPaths['zh-cn'] || langPaths[langs[0]]
      } else {
        filepath = path.resolve(process.cwd(), jspath)
      }
      // 验证目录存在
      try {
        fs.accessSync(filepath, fs.constants.F_OK)
      } catch (error) {
        logger.error(`${filepath}文件或目录不存在`)
        process.exit()
      }
      // 导出execl
      const buildDatas = []
      const extname = getExtname(filepath)
      // 单文件处理
      if (extname === 'js') {
        const name = getFilenameWithoutExt(filepath)
        const data = generateExcelData(USER_CONFIG, name, {
          'unknow': filepath
        })
        buildDatas.push({
          name,
          data
        })
      } else {
      // 文件夹处理
        fs.readdirSync(filepath)
          .filter(filename => filename !== 'index.js' && filename.indexOf('.js') > -1)
          .forEach(filename => {
            const name = getFilenameWithoutExt(filename)
            let paths
            // 有传入配置时，使用配置目录
            if (jspath) {
              paths = {
                'unknow': path.resolve(filepath, filename)
              }
            } else {
            // 无传入配置时，使用配置文件中已配目录
              paths = langs.reduce((target, lang) => {
                target[lang] = path.resolve(langPaths[lang], filename)
                return target
              }, {})
            }
            const data = generateExcelData(USER_CONFIG, name, paths)
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
