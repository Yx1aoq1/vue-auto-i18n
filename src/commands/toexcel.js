import path from 'path'
import xlsx from 'node-xlsx'
import { LocaleLoader } from '../localeLoader'
import { Global } from '../global'
import { exportFile } from '../utils/fs'

function generateExcelData(localeLoader, namespace) {
  const locales = localeLoader.languages
  const cols = ['key', ...locales]
  const data = [cols]
  const sourceLanguageTrans = localeLoader.findTranslateByKeypath({
    locale: Global.sourceLanguage,
    namespace
  })
  const paths = Object.keys(sourceLanguageTrans)
  paths.map(keypath => {
    const trans = locales.map(locale => {
      return localeLoader.findTranslateByKeypath({
        locale,
        namespace,
        keypath
      })
    })
    const key = namespace ? `${namespace}.${keypath}` : keypath
    data.push([key, ...trans])
  })
  return data
}

export default function toexcel(program) {
  program
    .command('toexcel [namespaces]')
    .option('-n, --name [exportname]', '输出文件名称')
    .option('-d, --dir [dir]', '输出文件位置')
    .description('将i18n文件转成excel，可以指定[namespaces]，多个以逗号隔开')
    .action(async (namespaces = '', { exportname = 'translate', dir = './' }) => {
      const localeLoader = new LocaleLoader(process.cwd())
      await localeLoader.init()
      let files
      if (namespaces) {
        namespaces = namespaces.split(',')
        files = localeLoader.findMatchFileByNamespaces(namespaces)
      } else {
        namespaces = localeLoader.namespaces
        files = localeLoader.files
      }
      if (!files || !files.length) {
        logger.error('找不到相应的翻译文件')
        return
      }
      const buildDatas = []
      // 配置了命名空间或存在命名空间配置时，导出按命名空间分成多个子表格
      if (namespaces.length) {
        namespaces.map(namespace => {
          buildDatas.push({
            name: namespace,
            data: generateExcelData(localeLoader, namespace)
          })
        })
      } else {
        buildDatas.push({
          name: 'auto-i18n-sheet',
          data: generateExcelData(localeLoader)
        })
      }
      if (buildDatas.length) {
        try {
          const sheetOptions = { '!cols': [{ wch: 15 }, { wch: 50 }, { wch: 50 }] }
          const buffer = xlsx.build(buildDatas, sheetOptions)
          const exportpath = path.join(dir, `${exportname}.xlsx`)
          // 如果文件存在，覆盖
          exportFile(exportpath, buffer, { flag: 'w' })
          logger.success('成功导出excel')
        } catch (error) {
          logger.error(error)
        }
      } else {
        logger.warn('没有可以导出的内容')
      }
    })
}
