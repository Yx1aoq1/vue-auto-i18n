"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = toexcel;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _nodeXlsx = _interopRequireDefault(require("node-xlsx"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/**
 * 对象扁平化处理
 * @param {*} obj 
 * @param {*} key 
 * @param {*} res 
 * @param {*} isArray 
 */
function flat(obj) {
  var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var res = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var isArray = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  for (var _i = 0, _Object$entries = Object.entries(obj); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        k = _Object$entries$_i[0],
        v = _Object$entries$_i[1];

    if (Array.isArray(v)) {
      var tmp = isArray ? key + '[' + k + ']' : key + k;
      flat(v, tmp, res, true);
    } else if (_typeof(v) === 'object') {
      var _tmp = isArray ? key + '[' + k + '].' : key + k + '.';

      flat(v, _tmp, res);
    } else {
      var _tmp2 = isArray ? key + '[' + k + ']' : key + k;

      res[_tmp2] = v;
    }
  }

  return res;
}

function getExtname(path) {
  var files = path.split(/\/|\\/);
  var filename = files.length ? files[files.length - 1] : '';
  var filenameWithoutSuffix = filename.split(/#|\?/)[0];
  var extname = (/[^./\\]*$/.exec(filenameWithoutSuffix) || [''])[0];
  return {
    name: filenameWithoutSuffix.split('.')[0],
    extname: extname
  };
}

function generateExcelData(filePath, filename) {
  var i18n = require(filePath)["default"];

  var flatI18n = flat(i18n);
  var data = [['key', '中文', '英文翻译']];
  Object.keys(flatI18n).map(function (key) {
    var value = flatI18n[key]; // key拼接文件名称

    data.push(["".concat(filename, ".").concat(key), value]);
  });
  return data;
}

function ensureDirectoryExistence(filePath) {
  var dirname = _path["default"].dirname(filePath);

  if (_fs["default"].existsSync(dirname)) {
    return true;
  }

  ensureDirectoryExistence(dirname);

  _fs["default"].mkdirSync(dirname);
}

function toexcel(program) {
  program.command('toexcel <jspath> [filename] [path]').description('将i18n文件转成excel').action(function (jspath, exportName, exportPath) {
    var fullPath = _path["default"].join(process.cwd(), jspath);

    _fs["default"].access(fullPath, _fs["default"].constants.F_OK, function (err) {
      if (err) {
        console.error("".concat(fullPath, "\u6587\u4EF6\u6216\u76EE\u5F55\u4E0D\u5B58\u5728"));
        process.exit();
      } else {
        var buildDatas = [];

        var _getExtname = getExtname(fullPath),
            name = _getExtname.name,
            extname = _getExtname.extname; // 单文件处理


        if (extname === 'js') {
          var data = generateExcelData(fullPath, name);
          buildDatas.push({
            name: name,
            data: data
          });
        } else {
          // 文件夹处理
          _fs["default"].readdirSync(fullPath).filter(function (filename) {
            return filename !== 'index.js' && filename.indexOf('.js') > -1;
          }).forEach(function (filename) {
            var filePath = _path["default"].join(fullPath, './' + filename);

            var _getExtname2 = getExtname(filename),
                name = _getExtname2.name;

            var data = generateExcelData(filePath, name);
            buildDatas.push({
              name: filename,
              data: data
            });
          });
        }

        if (buildDatas.length) {
          var buffer = _nodeXlsx["default"].build(buildDatas);

          var exportFilePath = _path["default"].join(exportPath || '', "".concat(exportName || 'translate', ".xlsx")); // 确保目录存在


          ensureDirectoryExistence(exportFilePath); // 如果文件存在，覆盖

          _fs["default"].writeFileSync(exportFilePath, buffer, {
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