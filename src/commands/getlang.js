import fs from 'fs'
import { LanguageUtils } from '../language'
import { getExtname } from '../utils/common'
import { travelDir } from '../utils/fs'

export default function getlang(program) {
  program
    .command('getlang <filepath> <exportName> [lang]')
    .description('对<filepath>文件进行中文提取，提取至<exportName>文件中')
    .action((filepath, exportName, lang = 'zh-cn') => {
      const languageUtils = new LanguageUtils(lang)
      // 验证目录存在
      try {
        fs.accessSync(filepath, fs.constants.F_OK)
      } catch (error) {
        logger.error(`${filepath}文件或目录不存在`)
        process.exit()
      }
      const extname = getExtname(filepath)
      // 单文件处理
      if (['vue', 'js'].includes(extname)) {
        languageUtils.translate(filepath, exportName)
        languageUtils.getLocale(exportName)
      } else {
        // 文件夹处理
        travelDir(filepath, path => {
          const ext = getExtname(path)
          if (['vue', 'js'].includes(ext)) {
            languageUtils.translate(path, exportName)
          }
        })
        languageUtils.getLocale(exportName)
      }
      logger.success(`已生成 ${exportName} 文件并导出至 ${languageUtils.langPath} 目录`)
    })
}
