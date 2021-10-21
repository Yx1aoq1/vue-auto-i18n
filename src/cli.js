import commands from './commands'
import program from 'commander'
import { version } from '../package.json'

program.version(version)

commands(program)

export function run (argv) {
  // 如果没有其他命令的话
  console.log(argv)
  if (!argv[2]) {
    program.help()
    return
  }
  program.parse(argv)
}