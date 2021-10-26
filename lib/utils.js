"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.getExtname = getExtname;
exports.getFilenameWithoutExt = getFilenameWithoutExt;
exports.isChineseChar = isChineseChar;

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