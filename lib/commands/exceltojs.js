"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = exceltojs;

var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/find"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _nodeXlsx = _interopRequireDefault(require("node-xlsx"));

var _common = require("../utils/common");

var _fs2 = require("../utils/fs");

function findExcelColLang(cfg, name) {
  var _context;

  const execelCols = cfg.execelCols || DEFAULT_EXCEL_COLS;
  return (0, _find.default)(_context = (0, _keys.default)(execelCols)).call(_context, key => execelCols[key] === name);
}

function parseExcelDatas(data) {
  var _context2;

  return (0, _reduce.default)(_context2 = data.shift()).call(_context2, (res, name, idx) => {
    if (name !== 'key') {
      const lang = findExcelColLang(USER_CONFIG, name) || `unknow_${idx}`;
      res[lang] = (0, _common.unflatten)((0, _reduce.default)(data).call(data, (target, item) => {
        const key = item[0];
        target[key] = item[idx];
        return target;
      }, {}));
    }

    return res;
  }, {});
}

function generateJSFromSheets(basePath, data) {
  (0, _map.default)(data).call(data, cur => {
    var _context3;

    const result = parseExcelDatas(cur.data);
    (0, _map.default)(_context3 = (0, _keys.default)(result)).call(_context3, lang => {
      const buffer = `export default ${(0, _stringify.default)(result[lang][cur.name], null, 2)}`;

      const exportFilePath = _path.default.resolve(basePath, lang, `${cur.name}.js`); // 确保目录存在


      (0, _fs2.ensureDirectoryExistence)(exportFilePath); // 如果文件存在，覆盖

      _fs.default.writeFileSync(exportFilePath, buffer, {
        flag: 'w'
      });
    });
  });
}

function exceltojs(program) {
  program.command('exceltojs <excelpath>').description('根据excel的翻译生成对应的国际化语言包(.js文件)').action(excelpath => {
    excelpath = _path.default.resolve(process.cwd(), excelpath); // 验证目录存在

    try {
      _fs.default.accessSync(excelpath, _fs.default.constants.F_OK);
    } catch (error) {
      logger.error(`${jspath}文件或目录不存在`);
      process.exit();
    }

    try {
      const sheets = _nodeXlsx.default.parse(_fs.default.readFileSync(excelpath));

      const basePath = _path.default.resolve(process.cwd(), USER_CONFIG.outputLanguagePath || DEFAULT_OUTPUT_PATH);

      generateJSFromSheets(basePath, sheets);
      logger.success(`解析excel文件成功，已导出文件至目录${basePath}`);
    } catch (err) {
      logger.error(`解析excel文件失败`);
      process.exit();
    }
  });
}