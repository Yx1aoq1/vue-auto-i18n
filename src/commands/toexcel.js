import fs from 'fs'
import os from 'os'
import path from 'path'
import xlsx from 'node-xlsx'
import getConfig from '../utils/config'
import { isObject, getExtname, getFilenameWithoutExt, isChineseChar, flat, getRandomStr } from '../utils/common'

function readESModuleFile (filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const tempPath = path.join(os.tmpdir(), `./temp${getRandomStr()}.js`)
  // 由于运行时不允许es6语法，只能替换一下再重新读取
  fs.writeFileSync(tempPath, content.replace('export default', 'exports.default ='), { flag: 'w' })
  const i18n = require(tempPath).default
  // 删除文件
  fs.unlinkSync(tempPath)
  return i18n
}

function generateExcelData (cfg, filename, languagePath) {
  const cols = ['key']
  const flatI18n = {}
  const execelCols = cfg.execelCols || DEFAULT_EXCEL_COLS
  const langs = Object.keys(languagePath)
  langs.map(lang => {
    cols.push(execelCols[lang])
    logger.info(lang, languagePath[lang])
    flatI18n[lang] = flat(readESModuleFile(languagePath[lang]))
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
        res.push(isChineseChar(value) ? '': isChineseChar(value))
      }
      return res
    }, [`${filename}.${key}`]))
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
    .command('toexcel [jspath] [filename] [path]')
		.description('将i18n文件转成excel')
		.action((jspath = '', exportName = 'translate', exportPath = '') => {
      const cfg = getConfig()
      const langPaths = getLanguagePaths(cfg)
      const langs = Object.keys(langPaths)
      logger.info(langPaths)
      if (!jspath) {
        jspath = langPaths['zh-cn'] || langPaths[langs[0]]
      } else {
        jspath = path.resolve(process.cwd(), jspath)
      }
      logger.info(jspath)
      // 验证目录存在
      fs.access(jspath, fs.constants.F_OK, err => {
        if (err) {
          error(`${jspath}文件或目录不存在`, err)
          process.exit()
        }
        // 导出execl
        const buildDatas = []
        const extname = getExtname(jspath)
        // 单文件处理
        if (extname === 'js') {
          const name = getFilenameWithoutExt(jspath)
          const data = generateExcelData(cfg, name, {
            'zh-cn': jspath
          })
          buildDatas.push({
            name,
            data
          })
        } else {
          // 文件夹处理
          fs.readFileSync(jspath)
            .filter(filename => filename !== 'index.js' && filename.indexOf('.js') > -1)
            .forEach(filename => {
              const name = getFilenameWithoutExt(filename)
              const data = generateExcelData(cfg, name, {
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
          const exportFilePath = path.join(exportPath, `${exportName}.xlsx`)
          // 确保目录存在
          ensureDirectoryExistence(exportFilePath)
          // 如果文件存在，覆盖
          fs.writeFileSync(exportFilePath, buffer, { flag: 'w' })
          logger.success('成功导出excel')
        } else {
          logger.warn('没有可以导出的内容')
        }
      })
		})
}
