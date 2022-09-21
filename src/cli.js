import './global'
import commands from './commands'
import program from 'commander'
import { version } from '../package.json'
import getConfig from './utils/config'
import { LocaleLoader } from './localeLoader'
import { LanguageUtils } from './language'

program.version(version)

commands(program)

export async function run(argv) {
  // 如果没有其他命令的话
  if (!argv[2]) {
    program.help()
    return
  }
  global.Config = getConfig()
  global.LocaleLoader = new LocaleLoader()
  global.LanguageUtils = new LanguageUtils()
  await global.LocaleLoader.init()
  program.parse(argv)
}
