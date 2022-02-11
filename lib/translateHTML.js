"use strict";

var _spliceInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/splice");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = _default;

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));

var _common = require("./utils/common");

var _scanner = _interopRequireDefault(require("./scanner"));

const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const ncname = '[a-zA-Z_][\\w\\-\\.]*';
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`);
const startTagClose = /^\s*(\/?)>/;
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
const comment = /^<!\--/;
const chinese = /[^\x00-\xff]+.*/g;
let IS_REGEX_CAPTURING_BROKEN = false;
'x'.replace(/x(.)?/g, function (m, g) {
  IS_REGEX_CAPTURING_BROKEN = g === '';
});

function _default(code, languageUtils, exportName) {
  /**
    * 截取 html 模板，并设置当前 html 模板的开始位置位于最初 html 模板里的位置
    */
  function advance(n) {
    index += n;
    html = html.substring(n);
  }
  /**
    * 解析开始标签，返回结果对象
    * {
    *   tagName, 标签名
    *   attrs, 特性匹配数组
    *   start, 开始标签在 template 里的开始位置
    *   end, （可选）开始标签在 template 里的结束位置
    *   unarySlash, 一元标签的 /
    * }
    */


  function parseStartTag() {
    const start = html.match(startTagOpen);

    if (start) {
      const match = {
        tagName: start[1],
        attrs: [],
        start: index
      };
      advance(start[0].length);
      let end, attr; // 没匹配到开始标签的关闭 && 匹配到特性

      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length);
        match.attrs.push(attr);
      }

      if (end) {
        // 一元标签的 slash
        match.unarySlash = end[1];
        advance(end[0].length);
        match.end = index;
        return match;
      }
    }
  }
  /**
    * 处理标签属性中的中文
    * @param {*} match 
    */


  function handleStartTag(match) {
    const tagName = match.tagName;
    const unarySlash = match.unarySlash;
    const unary = !!unarySlash;
    let text = origin.substring(match.start, match.end);
    let start = match.start;
    const l = match.attrs.length;

    for (let i = 0; i < l; i++) {
      var _context;

      const args = match.attrs[i];

      if (IS_REGEX_CAPTURING_BROKEN && (0, _indexOf.default)(_context = args[0]).call(_context, '""') === -1) {
        if (args[3] === '') {
          delete args[3];
        }

        if (args[4] === '') {
          delete args[4];
        }

        if (args[5] === '') {
          delete args[5];
        }
      } // 特性的名称与值


      const name = args[1];
      const value = args[3] || args[4] || args[5] || ''; // 判断是否有中文字符，替换中文字符

      if (value && (0, _common.isChineseChar)(value)) {
        if (!(0, _includes.default)(name).call(name, ':')) {
          const attrNameStart = start + (0, _indexOf.default)(text).call(text, name);
          const attrNameEnd = attrNameStart + name.length;
          codeReplace(attrNameStart, attrNameEnd, `:${name}`);
        }

        handleReplaceChineseChar(value, start + (0, _indexOf.default)(text).call(text, value), false);
      }

      const offset = (0, _indexOf.default)(text).call(text, args[0]) + args[0].length;
      text = text.substring(offset);
      start += offset;
    } // 非一元标签，更新 lastTag


    if (!unary) {
      lastTag = tagName;
    }
  }

  function handleReplaceChineseChar(text, start, isTemplate = true) {
    const scanner = new _scanner.default(text);
    let words; // 当处理的字符串是template模板时

    if (/{{.*}}/.test(text)) {
      while (!scanner.eos()) {
        words = scanner.scanUtil('{{');

        if (words && (0, _common.isChineseChar)(words)) {
          const identifier = languageUtils.stringToIdentifier(exportName, words);
          codeReplace(start + scanner.pos - words.length, start + scanner.pos, `{{ ${identifier} }}`);
        }

        scanner.scan('{{');
        words = scanner.scanUtil('}}');

        if (words && (0, _common.isChineseChar)(words) && !(0, _includes.default)(words).call(words, '|')) {
          handleReplaceChineseChar(words, start + scanner.pos - words.length, false);
        }

        scanner.scan('}}');
      }

      return;
    } // 处理的字符串为ES6语法的模板


    if (/^`(.+)`$/.test(text)) {
      // // 如果模板不存在任何的
      // if (!/\${[\s\S]+}/.test(text)) {
      // }
      // while (!scanner.eos()) {
      //   words = scanner.scanUtil('${')
      // }
      return;
    } // 其他情况，寻找引号标签包裹的中文


    let quote = "'";

    while (!scanner.eos()) {
      words = scanner.scanUtil(quote); // 引号前包含中文，说明这段文字就是纯中文，直接退出循环

      if (words && (0, _common.isChineseChar)(words)) {
        const zhMatch = words.match(chinese);

        while (zhMatch && zhMatch.length) {
          const char = zhMatch.shift();
          const charStart = start + (0, _indexOf.default)(words).call(words, char);
          const charEnd = charStart + char.length;
          const identifier = languageUtils.stringToIdentifier(exportName, char);
          codeReplace(charStart, charEnd, isTemplate ? `{{ ${identifier} }}` : identifier);
        }

        break;
      }

      scanner.scan(quote);
      words = scanner.scanUtil(quote); // 有可能匹配到转义符后的引号，需要找到不是转义符后的引号

      while ((0, _slice.default)(words).call(words, -1) === '\\') {
        scanner.scan(quote);
        words += quote + scanner.scanUtil(quote);
      }

      if (words && (0, _common.isChineseChar)(words)) {
        const identifier = languageUtils.stringToIdentifier(exportName, words);
        codeReplace(start + scanner.pos - words.length - 1, start + scanner.pos + 1, identifier);
      }

      scanner.scan(quote);
    }
  }

  function codeReplace(start, end, replace) {
    code = (0, _spliceInstanceProperty(_common))(code, start + offset, end + offset, replace);
    offset = code.length - origin.length;
    console.log('code:', code);
  }

  const origin = code;
  let index = 0;
  let offset = 0;
  let html = code;
  let lastTag;

  while (html) {
    let textEnd = (0, _indexOf.default)(html).call(html, '<');

    if (textEnd === 0) {
      // Comment:
      if (comment.test(html)) {
        const commentEnd = (0, _indexOf.default)(html).call(html, '-->');

        if (commentEnd >= 0) {
          advance(commentEnd + 3);
          continue;
        }
      } // End tag:


      const endTagMatch = html.match(endTag);

      if (endTagMatch) {
        advance(endTagMatch[0].length);
        continue;
      } // Start tag:


      const startTagMatch = parseStartTag();

      if (startTagMatch) {
        handleStartTag(startTagMatch);
        continue;
      }
    } // 若是不能匹配，则获取文本


    let text, rest, next;

    if (textEnd >= 0) {
      rest = (0, _slice.default)(html).call(html, textEnd); // 查找到第一个能解析出来的 <，从 0 ~ 这个能解析出来的 < 字符之间的内容都是文本（有可能找不到能解析的 <）

      while (!endTag.test(rest) && !startTagOpen.test(rest) && !comment.test(rest)) {
        // 若 html 里只有一个 <
        next = (0, _indexOf.default)(rest).call(rest, '<', 1);
        if (next < 0) break; // 若 html 里有至少两个 <

        textEnd += next;
        rest = (0, _slice.default)(html).call(html, textEnd);
      } // while 循环结束时，textEnd 为 html 里最后一个不能解析为 结束标签/开始标签的前部/注释标签/条件注释标签 的 < 的位置
      // 即 textEnd 之前的部分都将成为文本


      text = html.substring(0, textEnd); // 判断是否有中文字符，替换中文字符

      if ((0, _common.isChineseChar)(text)) {
        handleReplaceChineseChar(text, index);
      }

      advance(textEnd);
    } // 若 html 里没有 <，则整个 html 都为文本


    if (textEnd < 0) {
      text = html; // 判断是否有中文字符，替换中文字符

      if ((0, _common.isChineseChar)(text)) {
        handleReplaceChineseChar(text, 0);
      }

      html = '';
    }
  }

  return code;
}