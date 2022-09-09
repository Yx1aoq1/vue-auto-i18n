import './global'
import getConfig from './utils/config'
import commands from './commands'
import program from 'commander'
import { version } from '../package.json'

program.version(version)

commands(program)

export function run(argv) {
  // 如果没有其他命令的话
  if (!argv[2]) {
    program.help()
    return
  }
  // 用户配置
  global.USER_CONFIG = getConfig()
  program.parse(argv)
}
