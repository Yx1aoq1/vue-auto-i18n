"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = toexcel;

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _nodeXlsx = _interopRequireDefault(require("node-xlsx"));

var _common = require("../utils/common");

var _fs2 = require("../utils/fs");

function generateExcelData(cfg, filename, languagePath) {
  var _context;

  const cols = ['key'];
  const flatI18n = {};
  const execelCols = cfg.execelCols || DEFAULT_EXCEL_COLS;
  const langs = (0, _keys.default)(languagePath);
  (0, _map.default)(langs).call(langs, lang => {
    cols.push(execelCols[lang]);
    flatI18n[lang] = (0, _common.flatten)((0, _fs2.readESModuleFile)(languagePath[lang]));
  });
  const data = [cols];
  (0, _map.default)(_context = (0, _keys.default)(flatI18n['zh-cn'] || flatI18n[langs[0]])).call(_context, key => {
    data.push((0, _reduce.default)(langs).call(langs, (res, lang) => {
      var _context2;

      const value = flatI18n[lang][key];

      if ((0, _includes.default)(_context2 = ['zh-cn', 'unknow']).call(_context2, lang)) {
        res.push(value);
      } else {
        res.push((0, _common.isChineseChar)(value) ? '' : value);
      }

      return res;
    }, [`${filename}.${key}`]));
  });
  return data;
}

function initLanguagePaths(cfg) {
  // 配置单个目录时：
  if (typeof cfg.languagePath === 'string') {
    const languages = cfg.languages || DEFAULT_LANGUAGES;
    return (0, _reduce.default)(languages).call(languages, (paths, lang) => {
      paths[lang] = _path.default.resolve(process.cwd(), cfg.languagePath, lang);
      return paths;
    }, {});
  } // 配置多个目录时：


  if ((0, _common.isObject)(cfg.languagePath)) {
    var _context3;

    return (0, _reduce.default)(_context3 = (0, _keys.default)(cfg.languagePath)).call(_context3, (target, lang) => {
      target[lang] = _path.default.resolve(process.cwd(), cfg.languagePath[lang]);
      return target;
    }, {});
  }

  return {};
}

function toexcel(program) {
  program.command('toexcel [jspath]').option('-n, --name <exportName>', '输出文件名称').option('-d, --dir <exportDir>', '输出文件位置').description('将i18n文件转成excel').action((jspath = '', {
    exportName = 'translate',
    exportDir = './'
  }) => {
    let filepath;
    const langPaths = initLanguagePaths(USER_CONFIG);
    const langs = (0, _keys.default)(langPaths);

    if (!jspath) {
      filepath = langPaths['zh-cn'] || langPaths[langs[0]];
    } else {
      filepath = _path.default.resolve(process.cwd(), jspath);
    } // 验证目录存在


    try {
      _fs.default.accessSync(filepath, _fs.default.constants.F_OK);
    } catch (error) {
      logger.error(`${filepath}文件或目录不存在`);
      process.exit();
    } // 导出execl


    const buildDatas = [];
    const extname = (0, _common.getExtname)(filepath); // 单文件处理

    if (extname === 'js') {
      const name = (0, _common.getFilenameWithoutExt)(filepath);
      const data = generateExcelData(USER_CONFIG, name, {
        unknow: filepath
      });
      buildDatas.push({
        name,
        data
      });
    } else {
      var _context4, _context5;

      // 文件夹处理
      (0, _forEach.default)(_context4 = (0, _filter.default)(_context5 = _fs.default.readdirSync(filepath)).call(_context5, filename => filename !== 'index.js' && (0, _indexOf.default)(filename).call(filename, '.js') > -1)).call(_context4, filename => {
        const name = (0, _common.getFilenameWithoutExt)(filename);
        let paths; // 有传入配置时，使用配置目录

        if (jspath) {
          paths = {
            unknow: _path.default.resolve(filepath, filename)
          };
        } else {
          // 无传入配置时，使用配置文件中已配目录
          paths = (0, _reduce.default)(langs).call(langs, (target, lang) => {
            target[lang] = _path.default.resolve(langPaths[lang], filename);
            return target;
          }, {});
        }

        const data = generateExcelData(USER_CONFIG, name, paths);
        buildDatas.push({
          name,
          data
        });
      });
    }

    if (buildDatas.length) {
      const buffer = _nodeXlsx.default.build(buildDatas);

      const exportFilePath = _path.default.join(exportDir, `${exportName}.xlsx`); // 如果文件存在，覆盖


      (0, _fs2.exportFile)(exportFilePath, buffer, {
        flag: 'w'
      });
      logger.success('成功导出excel');
    } else {
      logger.warn('没有可以导出的内容');
    }
  });
}