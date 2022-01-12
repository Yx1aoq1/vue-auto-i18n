"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.flatten = flatten;
exports.getExtname = getExtname;
exports.getFilenameWithoutExt = getFilenameWithoutExt;
exports.getRandomStr = getRandomStr;
exports.isChineseChar = isChineseChar;
exports.isObject = isObject;
exports.unflatten = unflatten;

var _entries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/entries"));

var _isArray = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/array/is-array"));

var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

function getExtname(path) {
  const filenameWithoutSuffix = path.split(/#|\?/)[0];
  return (/[^./\\]*$/.exec(filenameWithoutSuffix) || [''])[0];
}

function getFilenameWithoutExt(path) {
  const files = path.split(/\/|\\/);
  const filename = files.length ? files[files.length - 1] : '';
  return filename.split('.')[0];
}
/**
 * 是否含有中文（也包含日文和韩文）
 * @param {*} str
 */


function isChineseChar(str) {
  var reg = /[\u4E00-\u9FA5\uF900-\uFA2D]/;
  return reg.test(str);
}
/**
 * 对象扁平化处理
 * @param {*} obj 
 * @param {*} key 
 * @param {*} res 
 * @param {*} isArray 
 */


function flatten(obj, key = '', res = {}, isArray = false) {
  for (let [k, v] of (0, _entries.default)(obj)) {
    if ((0, _isArray.default)(v)) {
      let tmp = isArray ? key + '[' + k + ']' : key + k;
      flatten(v, tmp, res, true);
    } else if (typeof v === 'object') {
      let tmp = isArray ? key + '[' + k + '].' : key + k + '.';
      flatten(v, tmp, res);
    } else {
      let tmp = isArray ? key + '[' + k + ']' : key + k;
      res[tmp] = v;
    }
  }

  return res;
}

function unflatten(data) {
  if (Object(data) !== data || (0, _isArray.default)(data)) return data;
  var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
      resultholder = {};

  for (var p in data) {
    var cur = resultholder,
        prop = "",
        m;

    while (m = regex.exec(p)) {
      cur = cur[prop] || (cur[prop] = m[2] ? [] : {});
      prop = m[2] || m[1];
    }

    cur[prop] = data[p];
  }

  return resultholder[""] || resultholder;
}
/**
 * 随机字符串
 */


function getRandomStr() {
  var _context;

  return (0, _slice.default)(_context = Math.random().toString(36)).call(_context, 2);
}