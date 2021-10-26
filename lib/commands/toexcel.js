"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = toexcel;

var _entries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/entries"));

var _isArray = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/array/is-array"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _fs = _interopRequireDefault(require("fs"));

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _nodeXlsx = _interopRequireDefault(require("node-xlsx"));

var _utils = require("../utils");

/**
 * 对象扁平化处理
 * @param {*} obj 
 * @param {*} key 
 * @param {*} res 
 * @param {*} isArray 
 */
function flat(obj, key = '', res = {}, isArray = false) {
  for (let [k, v] of (0, _entries.default)(obj)) {
    if ((0, _isArray.default)(v)) {
      let tmp = isArray ? key + '[' + k + ']' : key + k;
      flat(v, tmp, res, true);
    } else if (typeof v === 'object') {
      let tmp = isArray ? key + '[' + k + '].' : key + k + '.';
      flat(v, tmp, res);
    } else {
      let tmp = isArray ? key + '[' + k + ']' : key + k;
      res[tmp] = v;
    }
  }

  return res;
}

function readESModuleFile(filePath) {
  const content = _fs.default.readFileSync(filePath, 'utf-8');

  const tempPath = _path.default.join(_os.default.tmpdir(), './temp.js'); // 由于运行时不允许es6语法，只能替换一下再重新读取


  _fs.default.writeFileSync(tempPath, content.replace('export default', 'exports.default ='), {
    flag: 'w'
  });

  const i18n = require(tempPath).default; // 删除文件


  _fs.default.unlinkSync(tempPath);

  return i18n;
}

function generateExcelData(filePath, filename) {
  var _context;

  const i18n = readESModuleFile(filePath);
  const flatI18n = flat(i18n);
  const data = [['key', '中文', '英文翻译']];
  (0, _map.default)(_context = (0, _keys.default)(flatI18n)).call(_context, key => {
    const value = flatI18n[key]; // key拼接文件名称

    data.push([`${filename}.${key}`, value]);
  });
  return data;
}

function ensureDirectoryExistence(filePath) {
  var dirname = _path.default.dirname(filePath);

  if (_fs.default.existsSync(dirname)) {
    return true;
  }

  ensureDirectoryExistence(dirname);

  _fs.default.mkdirSync(dirname);
}

function toexcel(program) {
  program.command('toexcel <jspath> [filename] [path]').description('将i18n文件转成excel').action((jspath, exportName = 'translate', exportPath = '') => {
    const fullPath = _path.default.join(process.cwd(), jspath);

    _fs.default.access(fullPath, _fs.default.constants.F_OK, err => {
      if (err) {
        console.error(`${fullPath}文件或目录不存在`);
        process.exit();
      } else {
        const buildDatas = [];
        const extname = (0, _utils.getExtname)(fullPath); // 单文件处理

        if (extname === 'js') {
          const name = (0, _utils.getFilenameWithoutExt)(fullPath);
          const data = generateExcelData(fullPath, name);
          buildDatas.push({
            name,
            data
          });
        } else {
          var _context2, _context3;

          // 文件夹处理
          (0, _forEach.default)(_context2 = (0, _filter.default)(_context3 = _fs.default.readdirSync(fullPath)).call(_context3, filename => filename !== 'index.js' && (0, _indexOf.default)(filename).call(filename, '.js') > -1)).call(_context2, filename => {
            const filePath = _path.default.join(fullPath, './' + filename);

            const name = (0, _utils.getFilenameWithoutExt)(fullPath);
            const data = generateExcelData(filePath, name);
            buildDatas.push({
              name: filename,
              data
            });
          });
        }

        if (buildDatas.length) {
          const buffer = _nodeXlsx.default.build(buildDatas);

          const exportFilePath = _path.default.join(exportPath, `${exportName}.xlsx`); // 确保目录存在


          ensureDirectoryExistence(exportFilePath); // 如果文件存在，覆盖

          _fs.default.writeFileSync(exportFilePath, buffer, {
            flag: 'w'
          });

          console.log('成功导出excel');
        } else {
          console.error('没有可以导出的内容');
        }
      }
    });
  });
}