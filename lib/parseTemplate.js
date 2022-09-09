"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.parseTemplate = parseTemplate;

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _trim = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/trim"));

var _every = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/every"));

var _scanner = require("./scanner");

var _common = require("./utils/common");

const chinese = /[^\x00-\xff]+.*/g;
const vname = /^[a-zA-Z\$_][a-zA-Z\d_]*$/; // 需要查找的关键字

const KEYWORD = ["'", '`', '{{', '}}', '${', '}', '"', '(', ')', '//', '/**', '*/', '\r\n'];
const MATCH_KEYWORD = {
  "'": "'",
  '"': '"',
  '`': '`',
  '${': '}',
  '}': '',
  '(': ')',
  '{{': '}}',
  '//': '\r\n',
  '/**': '*/'
};

function parseTemplate(template) {
  const scanner = new _scanner.Scanner(template);
  const tokens = [];
  const keywordStack = [];
  let words;
  let keyword;
  let pos;
  let matched;
  let isExp = false;
  let idx = 0;
  let params = [];
  let ignore = false; // 查找关键字

  words = scanner.scanUtil(KEYWORD); // 没有查询到任何关键字或者关键字前包含中文，都按全段文字为中文处理

  if (!scanner.keyword || (0, _common.isChineseChar)(words) && scanner.keyword !== '{{') {
    const zhMatch = template.match(chinese);

    while (zhMatch && zhMatch.length) {
      const char = zhMatch.shift();
      const start = (0, _indexOf.default)(template).call(template, char);
      tokens.push({
        type: 'text',
        text: char,
        start,
        end: start + char.length
      });
    }

    return tokens;
  } // 遍历字符串


  while (!scanner.eos()) {
    var _context, _context3;

    pos = scanner.pos;
    keyword = scanner.keyword; // 如果关键字前一个字符为转义符，则不是需要找的关键字，继续向后查询

    if ((0, _slice.default)(words).call(words, -1) === '\\') {
      scanner.scan();
      scanner.scanUtil(KEYWORD);
      continue;
    } // 需要忽略注释及console.log的中文


    if ((0, _includes.default)(_context = ['//', '/**']).call(_context, keyword) || keyword === '(' && (0, _includes.default)(words).call(words, 'console.log')) {
      ignore = true;
    }

    if (keyword === '${') {
      isExp = true;
    }

    if (keyword === '{{' && (0, _common.isChineseChar)(words)) {
      tokens.push({
        type: 'text',
        text: words,
        start: pos - words.length,
        end: pos
      });
    }

    matched = matchPairKeyword(keyword, pos);

    if (matched && !ignore) {
      var _context2;

      const token = (0, _slice.default)(template).call(template, matched.pos + matched.keyword.length, pos);
      const end = scanner.pos + keyword.length; // 引号匹配时，引号包裹的部分是需要检验的目标

      if ((0, _includes.default)(_context2 = ["'", '"']).call(_context2, matched.keyword) && (0, _common.isChineseChar)(token) && !isExp) {
        tokens.push({
          type: 'string',
          text: token,
          start: matched.pos,
          end
        });
      } // ES6模板语法匹配


      if (keyword === '`' && !isExp) {
        if ((0, _common.isChineseChar)(token)) {
          const paramsTokens = (0, _map.default)(params).call(params, item => {
            return {
              start: item.start - matched.pos - 1,
              end: item.end - matched.pos - 1,
              name: `{${item.name}}`
            };
          });
          tokens.push({
            type: params.length ? 'template' : 'string',
            text: (0, _common.codeReplace)(token, paramsTokens, item => item.name),
            start: matched.pos,
            end,
            params,
            origin: token
          });
        }

        params = [];
      } // ES6模板语法中的参数匹配


      if (keyword === '}') {
        const isSimple = vname.test((0, _trim.default)(token).call(token));
        const name = isSimple ? token : `value${idx++}`;
        const value = isSimple ? null : (0, _trim.default)(token).call(token);
        params.push({
          name,
          expression: value,
          start: matched.pos,
          end,
          tokens: isSimple ? [] : parseTemplate(value)
        });
      }
    }

    if (matched && (0, _includes.default)(_context3 = [')', '*/', '\r\n']).call(_context3, keyword)) {
      ignore = false;
    }

    if ((0, _every.default)(keywordStack).call(keywordStack, item => item.keyword !== '${')) {
      isExp = false;
    }

    scanner.scan();
    words = scanner.scanUtil(KEYWORD);
  }

  return tokens;

  function matchPairKeyword(keyword, pos) {
    const keyMatch = MATCH_KEYWORD[keyword];
    const len = keywordStack.length;

    if (!len) {
      keyMatch && keywordStack.push({
        keyword,
        pos
      });
      return;
    }

    const last = keywordStack[len - 1];

    if (MATCH_KEYWORD[last.keyword] !== keyword) {
      keyMatch && keywordStack.push({
        keyword,
        pos
      });
      return;
    } else {
      return keywordStack.pop();
    }
  }
}