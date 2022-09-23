import fs from 'fs'
import { Global } from '../global'
import { Translater } from '../translater'
import { getExtname } from '../utils/common'
import { travelDir } from '../utils/fs'

export default function getlang(program) {
  program
    .command('getlang <filepath> <exportName>')
    .description('对<filepath>文件进行中文提取，提取至<exportName>文件中')
    .action(async (filepath, exportName) => {
      const translater = await Translater.create()
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
      } else {
        // 文件夹处理
        travelDir(filepath, path => {
          const ext = getExtname(path)
          if (Global.enableTransExts.includes(ext)) {
          }
        })
      }
      // logger.success(`已生成 ${exportName} 文件并导出至 ${languageUtils.langPath} 目录`)
    })
}
