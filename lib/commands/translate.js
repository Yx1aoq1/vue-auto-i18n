"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = transalte;

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _fs = _interopRequireDefault(require("fs"));

var _language = require("../language");

var _common = require("../utils/common");

var _fs2 = require("../utils/fs");

function transalte(program) {
  program.command('translate <filepath> <exportName> [lang]').description('对<filepath>文件进行中文提取并替换，提取至<exportName>文件中').action((filepath, exportName, lang = 'zh-cn') => {
    var _context;

    const languageUtils = new _language.LanguageUtils(lang); // 验证目录存在

    try {
      _fs.default.accessSync(filepath, _fs.default.constants.F_OK);
    } catch (error) {
      logger.error(`${filepath}文件或目录不存在`);
      process.exit();
    }

    const extname = (0, _common.getExtname)(filepath); // 单文件处理

    if ((0, _includes.default)(_context = ['vue', 'js']).call(_context, extname)) {
      languageUtils.translate(filepath, exportName, true);
      languageUtils.getLocale(exportName);
    } else {
      // 文件夹处理
      (0, _fs2.travelDir)(filepath, path => {
        var _context2;

        const ext = (0, _common.getExtname)(path);

        if ((0, _includes.default)(_context2 = ['vue', 'js']).call(_context2, ext)) {
          languageUtils.translate(path, exportName, true);
        }
      });
      languageUtils.getLocale(exportName);
    }

    logger.success('已成功替换中文，请自行检查代码');
  });
}