"use strict";

var _spliceInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/splice");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = translateJS;

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _common = require("./utils/common");

var _parseTemplate = _interopRequireDefault(require("./parseTemplate"));

function translateJS(code, languageUtils, exportName, isVue = true) {
  function codeReplace(start, end, replace) {
    code = (0, _spliceInstanceProperty(_common))(code, start + offset, end + offset, replace);
    offset = code.length - origin.length;
  }

  const importI18nFun = (0, _common.once)(importFun => {
    const start = isVue ? 2 : 0; // vue 文件中首个字符通常为换行

    code = (0, _spliceInstanceProperty(_common))(code, start, start, `${importFun}\r\n`);
    offset = code.length - origin.length;
  });
  const origin = code;
  const tokens = (0, _parseTemplate.default)(origin);
  const exportLocation = (0, _indexOf.default)(origin).call(origin, 'export');
  let offset = 0;
  (0, _forEach.default)(tokens).call(tokens, token => {
    var _context;

    const params = (0, _map.default)(_context = token.params || []).call(_context, item => ({
      name: item.name,
      value: item.value && translateJS(item.value, languageUtils, exportName, isVue)
    }));
    const identifier = languageUtils.stringToIdentifier(exportName, token.text, params);
    let value;

    if (isVue && token.start > exportLocation) {
      value = `this.${identifier}`;
    } else {
      value = `i18n.${identifier.substring(1)}`;
      USER_CONFIG.importI18nFunction && importI18nFun(USER_CONFIG.importI18nFunction);
    }

    codeReplace(token.start, token.end, value);
  });
  return code;
}