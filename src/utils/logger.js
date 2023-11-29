import chalk from 'chalk'
import dayjs from 'dayjs'
// logger
const info = console.info
global.logger = {
  log: console.log,
  success: function () {
    info(chalk.green(' √ ' + [].slice.call(arguments).join(' ')))
  },
  warn: function () {
    info(chalk.yellow(' ∆ ' + [].slice.call(arguments).join(' ')))
  },
  error: function () {
    info(chalk.bold.red(' X '), chalk.bold.red([].slice.call(arguments).join(' ')))
  },
  info: function () {
    console.log(chalk.cyan('[auto-i18n] '), [].slice.call(arguments).join(' '))
  },
  logWithTime: function () {
    info(
      chalk.cyan('[auto-i18n] ') +
        ' [' +
        dayjs().format('YY.MM.DD HH:mm:ss') +
        '] ' +
        [].slice.call(arguments).join(' ')
    )
  }
}
