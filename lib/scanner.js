"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _isArray = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/array/is-array"));

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

class Scanner {
  constructor(templateStr) {
    this.templateStr = templateStr;
    this.pos = 0;
    this.tail = templateStr;
    this.keyword = null;
  }

  scan() {
    var _context;

    if ((0, _indexOf.default)(_context = this.tail).call(_context, this.keyword) === 0) {
      this.pos += this.keyword.length;
      this.tail = this.templateStr.substring(this.pos);
    }
  }

  scanUtil(stopTag) {
    if ((0, _isArray.default)(stopTag) && stopTag.length) {
      this.keyword = this.findNearestKeyword(stopTag);
      return this.scanUtil(this.keyword);
    }

    this.keyword = stopTag;
    const pos_backup = this.pos;

    while (!this.eos() && (0, _indexOf.default)(_context2 = this.tail).call(_context2, stopTag) !== 0) {
      var _context2;

      this.pos++;
      this.tail = this.templateStr.substring(this.pos);
    }

    return this.templateStr.substring(pos_backup, this.pos);
  }

  eos() {
    return this.pos >= this.templateStr.length;
  }

  findKeywordPos(keyword) {
    var _context3;

    return (0, _indexOf.default)(_context3 = this.tail).call(_context3, keyword);
  }

  findNearestKeyword(keys = []) {
    if (!keys.length) return null;
    let nearest;
    let min = Infinity;
    (0, _forEach.default)(keys).call(keys, keyword => {
      const pos = this.findKeywordPos(keyword);

      if (pos !== -1 && pos < min) {
        min = pos;
        nearest = keyword;
      }
    });
    return nearest;
  }

}

exports.default = Scanner;