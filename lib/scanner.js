"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

class Scanner {
  constructor(templateStr) {
    // 将模板字符串写到实例身上
    this.templateStr = templateStr; // 指针

    this.pos = 0; // 尾巴，一开始就是模板字符串原文

    this.tail = templateStr;
  } // 功能弱，就是走过指定内容，没有返回值，就是跳过{{和}}两个符号


  scan(tag) {
    var _context;

    if ((0, _indexOf.default)(_context = this.tail).call(_context, tag) === 0) {
      // tag有多长，比如{{长度是2，就让指针后移多少位
      this.pos += tag.length; // 尾巴也要变，改变尾巴为从当前指针这个字符开始，到最后的全部字符

      this.tail = this.templateStr.substring(this.pos);
    }
  } // 让指针进行扫描，直到遇见指定内容结束，并且能够返回结束之前路过的文字


  scanUtil(stopTag) {
    // 记录一下执行本方法的时候pos的值
    const pos_backup = this.pos; // 当尾巴的开头不是stopTag的时候，就说明还没有扫描到stopTag
    // 写&&很有必要，因为防止找不到，那么寻找到最后也要停止下来

    while (!this.eos() && (0, _indexOf.default)(_context2 = this.tail).call(_context2, stopTag) !== 0) {
      var _context2;

      this.pos++; // 改变尾巴为从当前指针这个字符开始，到最后的全部字符

      this.tail = this.templateStr.substring(this.pos);
    }

    return this.templateStr.substring(pos_backup, this.pos);
  } // 指针是否已经到头，返回布尔值。end of string


  eos() {
    return this.pos >= this.templateStr.length;
  }

}

exports.default = Scanner;