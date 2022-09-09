"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = translateHTML;

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _parseHTML = require("./parseHTML");

var _common = require("./utils/common");

var _parseTemplate = require("./parseTemplate");

function translateHTML(html, languageUtils, exportName) {
  const tokens = [];
  (0, _parseHTML.parseHTML)(html, {
    expectHTML: true,
    shouldKeepComment: false,

    start(tag, attrs, unary, start, end) {
      if (attrs && attrs.length) {
        (0, _map.default)(attrs).call(attrs, attr => {
          if ((0, _common.isChineseChar)(attr.value)) {
            tokens.push({
              type: 'attribute',
              ...attr,
              tokens: (0, _parseTemplate.parseTemplate)(attr.value)
            });
          }
        });
      }
    },

    chars(text, start, end) {
      if ((0, _common.isChineseChar)(text)) {
        tokens.push({
          type: 'chars',
          text,
          start,
          end,
          tokens: (0, _parseTemplate.parseTemplate)(text)
        });
      }
    }

  });

  const handleToken = USER_CONFIG.translateHTMLFun || function (token, isInTemplate) {
    var _context;

    let value;

    if (token.type === 'chars') {
      value = (0, _common.codeReplace)(token.text, token.tokens, t => handleToken(t, true));
      return value;
    }

    if (token.type === 'attribute') {
      value = (0, _common.codeReplace)(token.value, token.tokens, t => handleToken(t, false));
      return `${token.name[0] === ':' ? '' : ':'}${token.name}="${value}"`;
    }

    const params = (0, _map.default)(_context = token.params || []).call(_context, item => ({
      name: item.name,
      value: item.expression && (0, _common.codeReplace)(item.expression, item.tokens, t => handleToken(t, false))
    }));
    const identifier = languageUtils.stringToIdentifier(exportName, token.text, params);

    if (isInTemplate && token.type === 'text') {
      value = `{{ ${identifier} }}`;
    } else {
      value = identifier;
    }

    return value;
  };

  html = (0, _common.codeReplace)(html, tokens, handleToken); // console.log(html)

  return html;
}