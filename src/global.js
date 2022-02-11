import chalk from 'chalk'
import dayjs from 'dayjs'
// logger
const info = console.info
global.logger = {
  log: console.log,
  success: function() {
    info(chalk.green(' √ ' + [].slice.call(arguments).join(' ')));
  },
  warn: function() {
    info(chalk.yellow(' ∆ ' + [].slice.call(arguments).join(' ')));
  },
  error: function() {
    info(chalk.bold.red(' X '), chalk.bold.red([].slice.call(arguments).join(' ')));
  },
  info: function() {
    console.log(chalk.cyan('[vue-auto-i18n] '), [].slice.call(arguments).join(' '))
  },
  logWithTime: function() {
    info(chalk.cyan('[vue-auto-i18n] ') + ' [' + dayjs().format('YY.MM.DD HH:mm:ss') + '] ' + [].slice.call(arguments).join(' '));
  }
}
// 配置文件名称
global.CONFIG_FILE_NAME = 'i18n.config.js'
// 默认中文翻译读取配置地址
global.DEFAULT_LANGUAGES = ['zh-cn', 'en']
// 默认导出excel列名
global.DEFAULT_EXCEL_COLS = {
  'zh-cn': '中文',
  en: '英文翻译',
  unknow: '未知'
}
global.DEFAULT_OUTPUT_PATH = './output/locale'

