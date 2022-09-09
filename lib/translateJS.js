"use strict";

var _spliceInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/splice");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = translateJS;

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _common = require("./utils/common");

var _parseTemplate = require("./parseTemplate");

function translateJS(code, languageUtils, exportName, isVue = true) {
  let isImportI18nFun = false;
  const exportLocation = (0, _indexOf.default)(code).call(code, 'export');

  const handleToken = USER_CONFIG.translateJSFun || function (token, isInVue) {
    var _context;

    if (isInVue === undefined) {
      isInVue = isVue && token.start > exportLocation;
    }

    const params = (0, _map.default)(_context = token.params || []).call(_context, item => ({
      name: item.name,
      value: item.expression && (0, _common.codeReplace)(item.expression, item.tokens, t => handleToken(t, isInVue))
    }));
    const identifier = languageUtils.stringToIdentifier(exportName, token.text, params);
    let value;

    if (isInVue) {
      value = `this.${identifier}`;
    } else {
      value = `i18n.${identifier.substring(1)}`;
      isImportI18nFun = true;
    }

    return value;
  };

  code = (0, _common.codeReplace)(code, (0, _parseTemplate.parseTemplate)(code), handleToken); // 是否引入i18n函数

  if (isImportI18nFun && USER_CONFIG.importI18nFunction) {
    const start = isVue ? 2 : 0; // vue 文件中首个字符通常为换行

    code = (0, _spliceInstanceProperty(_common))(code, start, start, `${USER_CONFIG.importI18nFunction}\r\n`);
  }

  return code;
}