"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));

var _chalk = _interopRequireDefault(require("chalk"));

var _dayjs = _interopRequireDefault(require("dayjs"));

// logger
const info = console.info;
global.logger = {
  log: console.log,
  success: function () {
    info(_chalk.default.green(' √ ' + (0, _slice.default)([]).call(arguments).join(' ')));
  },
  warn: function () {
    info(_chalk.default.yellow(' ∆ ' + (0, _slice.default)([]).call(arguments).join(' ')));
  },
  error: function () {
    info(_chalk.default.bold.red(' X '), _chalk.default.bold.red((0, _slice.default)([]).call(arguments).join(' ')));
  },
  info: function () {
    console.log(_chalk.default.cyan('[vue-auto-i18n] '), (0, _slice.default)([]).call(arguments).join(' '));
  },
  logWithTime: function () {
    info(_chalk.default.cyan('[vue-auto-i18n] ') + ' [' + (0, _dayjs.default)().format('YY.MM.DD HH:mm:ss') + '] ' + (0, _slice.default)([]).call(arguments).join(' '));
  }
}; // 配置文件名称

global.CONFIG_FILE_NAME = 'i18n.config.js'; // 默认中文翻译读取配置地址

global.DEFAULT_LANGUAGES = ['zh-cn', 'en']; // 默认导出excel列名

global.DEFAULT_EXCEL_COLS = {
  'zh-cn': '中文',
  en: '英文翻译',
  unknow: '未知'
}; // 默认导出的路径

global.DEFAULT_OUTPUT_PATH = './output/locale'; // 默认导出的格式

global.DEFAULT_EXPORT_FILE_TYPE = 'js';