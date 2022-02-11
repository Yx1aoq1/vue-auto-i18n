"use strict";

var _spliceInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/splice");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = _default;

var _findIndex = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/find-index"));

var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));

var _acorn = require("acorn");

var _common = require("./utils/common");

function _default(code, languageUtils, exportName, isVue = true) {
  function codeReplace(start, end, replace) {
    code = (0, _spliceInstanceProperty(_common))(code, start + offset, end + offset, replace);
    offset = code.length - origin.length;
  }

  function handleReplaceChineseChar(start, end, text) {
    const identifier = languageUtils.stringToIdentifier(exportName, text);
    let value;

    if (isVue && start > exportLocation) {
      value = `this.${identifier}`;
    } else {
      value = `i18n.${identifier.substring(1)}`;
      USER_CONFIG.importI18nFunction && importI18nFun(USER_CONFIG.importI18nFunction);
    }

    codeReplace(start, end, value);
  }

  const importI18nFun = (0, _common.once)(importFun => {
    const start = isVue ? 2 : 0; // vue 文件中首个字符通常为换行

    code = (0, _spliceInstanceProperty(_common))(code, start, start, `${importFun}\r\n`);
    offset = code.length - origin.length;
  });
  const origin = code;
  let tokens = [..._acorn.Parser.tokenizer(origin, {
    ecmaVersion: 7
  })];
  let exportLocation;
  let offset = 0;

  while (tokens.length) {
    const token = tokens.shift();

    if (token.type.label === 'export') {
      exportLocation = token.start;
    }

    if (token.type.label === 'string' && (0, _common.isChineseChar)(token.value)) {
      handleReplaceChineseChar(token.start, token.end, token.value);
    }

    if (token.type.label === '`') {
      const endTokenIdx = (0, _findIndex.default)(tokens).call(tokens, item => item.type.label === '`');
      const start = token.start;
      const end = tokens[endTokenIdx].end;
      const text = origin.substring(start, end);

      if ((0, _common.isChineseChar)(text)) {
        handleReplaceChineseChar(start, end, text);
      }

      tokens = (0, _slice.default)(tokens).call(tokens, endTokenIdx + 1);
    } // 跳过console.log的国际化


    if (token.type.label === 'name' && token.value === 'console') {
      const leftBracketIdx = (0, _findIndex.default)(tokens).call(tokens, item => item.type.label === '(');
      const stack = [leftBracketIdx];
      let curToken,
          index = leftBracketIdx + 1;

      while (stack.length) {
        curToken = tokens[index++];

        if (curToken.type.label === ')') {
          stack.pop();
        }

        if (curToken.type.label === '(') {
          stack.push(index);
        }
      }

      tokens = (0, _slice.default)(tokens).call(tokens, index);
    }
  }

  return code;
}