"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.ensureDirectoryExistence = ensureDirectoryExistence;
exports.isDirectory = isDirectory;
exports.readESModuleFile = readESModuleFile;

var _fs = _interopRequireDefault(require("fs"));

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _dayjs = _interopRequireDefault(require("dayjs"));

/**
 * 创建文件目录，确保文件目录存在
 * @param {*} filePath 
 */
function ensureDirectoryExistence(filePath) {
  var dirname = _path.default.dirname(filePath);

  if (_fs.default.existsSync(dirname)) {
    return true;
  }

  ensureDirectoryExistence(dirname);

  _fs.default.mkdirSync(dirname);
}
/**
 * 读取ES6 export default js 文件
 * @param {*} filePath 
 */


function readESModuleFile(filePath) {
  const content = _fs.default.readFileSync(filePath, 'utf-8');

  const tempPath = _path.default.join(_os.default.tmpdir(), `./temp${(0, _dayjs.default)().valueOf()}.js`); // 由于运行时不允许es6语法，只能替换一下再重新读取


  _fs.default.writeFileSync(tempPath, content.replace('export default', 'exports.default ='), {
    flag: 'w'
  });

  const obj = require(tempPath).default; // 删除文件


  _fs.default.unlinkSync(tempPath);

  return obj;
}
/**
 * 判断当前目录是否是文件夹
 * @param {*} filepath 
 */


function isDirectory(filepath) {
  return _fs.default.statSync(filepath).isDirectory();
}