import { LocaleLoader } from '../localeLoader'

export default function getlang(program) {
  program
    .command('search <text>')
    .description('查找指定<text>的所有翻译')
    .option('-f, --fuzzy', '是否使用模糊匹配', false)
    .action(async (text, { fuzzy }) => {
      const localeLoader = new LocaleLoader(process.cwd())
      await localeLoader.init()
      const localeKeys = localeLoader.findAllMatchLocaleKey(text, fuzzy)
      if (localeKeys.length) {
        logger.success('已查找匹配的国际化翻译Key:', localeKeys.toString())
      } else {
        logger.warn('未查找到匹配的翻译')
      }
    })
}
