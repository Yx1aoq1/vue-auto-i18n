"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = getlang;

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _fs = _interopRequireDefault(require("fs"));

var _language = _interopRequireDefault(require("../language"));

var _common = require("../utils/common");

var _fs2 = require("../utils/fs");

function getlang(program) {
  program.command('getlang <filepath> <exportName> [lang]').description('对<filepath>文件进行中文提取，提取至<exportName>文件中').action((filepath, exportName, lang = 'zh-cn') => {
    var _context;

    const languageUtils = new _language.default(lang); // 验证目录存在

    try {
      _fs.default.accessSync(filepath, _fs.default.constants.F_OK);
    } catch (error) {
      logger.error(`${filepath}文件或目录不存在`);
      process.exit();
    }

    const extname = (0, _common.getExtname)(filepath); // 单文件处理

    if ((0, _includes.default)(_context = ['vue', 'js']).call(_context, extname)) {
      languageUtils.translate(filepath, exportName);
      languageUtils.getLocale(exportName);
    } else {
      // 文件夹处理
      (0, _fs2.travelDir)(filepath, path => {
        var _context2;

        const ext = (0, _common.getExtname)(path);

        if ((0, _includes.default)(_context2 = ['vue', 'js']).call(_context2, ext)) {
          languageUtils.translate(path, exportName);
        }
      });
      languageUtils.getLocale(exportName);
    }

    logger.success(`已生成 ${exportName} 文件并导出至 ${languageUtils.langPath} 目录`);
  });
}