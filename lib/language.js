"use strict";

var _WeakMap = require("@babel/runtime-corejs3/core-js-stable/weak-map");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/map"));

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _entries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/entries"));

var _map2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _common = require("./utils/common");

var _fs2 = require("./utils/fs");

var _translateHTML = _interopRequireDefault(require("./translateHTML"));

var _translateJS = _interopRequireDefault(require("./translateJS"));

var vueCompiler = _interopRequireWildcard(require("vue-template-compiler"));

var _vueSfcDescriptorStringify = _interopRequireDefault(require("vue-sfc-descriptor-stringify"));

var _lodash = _interopRequireDefault(require("lodash.clonedeep"));

function _getRequireWildcardCache(nodeInterop) { if (typeof _WeakMap !== "function") return null; var cacheBabelInterop = new _WeakMap(); var cacheNodeInterop = new _WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = _Object$defineProperty && _Object$getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? _Object$getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { _Object$defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function handleVueCode(code, languageUtils, exportName) {
  const originSfcDescriptor = vueCompiler.parseComponent(code);
  const sfcDescriptor = (0, _lodash.default)(originSfcDescriptor);
  sfcDescriptor.template.content = handleTemplateCode(sfcDescriptor.template.content, languageUtils, exportName);
  sfcDescriptor.script.content = handleJavaScriptCode(sfcDescriptor.script.content, languageUtils, exportName);
  return (0, _vueSfcDescriptorStringify.default)(sfcDescriptor, originSfcDescriptor);
}

function handleTemplateCode(code, languageUtils, exportName) {
  // 该文件代码是否忽略国际化
  if (isIgnore(code)) {
    return code;
  }

  return (0, _translateHTML.default)(code, languageUtils, exportName);
}

function handleJavaScriptCode(code, languageUtils, exportName, isVue) {
  // 该文件代码是否忽略国际化
  if (isIgnore(code)) {
    return code;
  }

  return (0, _translateJS.default)(code, languageUtils, exportName, isVue);
}
/**
 * 如果代码中包含 i18nIgnore 关键字，则该文件忽略国际化
 * @param {*} code
 */


function isIgnore(code) {
  return (0, _includes.default)(code).call(code, 'i18nIgnore');
}

class LanguageUtils {
  constructor(lang) {
    this.cfg = USER_CONFIG;
    this.langPath = _path.default.resolve(process.cwd(), this.cfg.outputLanguagePath, lang);
    this.map = this.createMap();
  }

  createMap() {
    var _context, _context2;

    const i18nMap = new _map.default();
    (0, _forEach.default)(_context = (0, _filter.default)(_context2 = _fs.default.readdirSync(this.langPath)).call(_context2, filename => filename !== 'index.js' && (0, _indexOf.default)(filename).call(filename, '.js') > -1)).call(_context, filename => {
      const name = (0, _common.getFilenameWithoutExt)(filename);

      const filepath = _path.default.resolve(this.langPath, filename);

      const flatI18n = (0, _common.flatten)((0, _fs2.readESModuleFile)(filepath));
      i18nMap.set(name, flatI18n);
    });
    return i18nMap;
  }

  findKey(name, text) {
    for (const [key, value] of (0, _entries.default)(_context3 = (0, _map2.default)(this)).call(_context3)) {
      var _context3;

      for (const subKey of (0, _keys.default)(value)) {
        if (value[subKey] === text) {
          return `${key}.${subKey}`;
        }
      }
    }

    const newKey = `trans_${(0, _common.getRandomStr)()}`;
    this.updateKey(name, newKey, text);
    return `${name}.${newKey}`;
  }

  updateKey(name, key, value) {
    const i18n = (0, _map2.default)(this).get(name) || {};
    i18n[key] = value;
    (0, _map2.default)(this).set(name, i18n);
  }

  stringToIdentifier(name, text) {
    const variable = /\$?\{?\{([a-zA-Z][a-zA-Z\d\.]*)\}?\}/g;
    const variableMatch = variable.exec(text);
    const vname = variableMatch && variableMatch[1];
    let param, key;

    if (vname && (0, _includes.default)(vname).call(vname, '.')) {
      param = `{ value: ${vname} }`;
      key = this.findKey(name, text.replace(variable, 'value'));
    } else {
      param = `{ ${name} }`;
      key = this.findKey(name, text.replace(variable, '{$1}'));
    }

    return !!variableMatch ? `$t('${key}', ${param})` : `$t('${key}')`;
  }

  getLocale(name, filepath, type) {
    let content = (0, _common.unflatten)((0, _map2.default)(this).get(name)) || {};

    if (!filepath) {
      filepath = _path.default.resolve(this.langPath, name);
    }

    (0, _fs2.exportLocale)(filepath, content, type);
  }

  translate(filepath, name, replace = false) {
    const extname = (0, _common.getExtname)(filepath);

    const code = _fs.default.readFileSync(filepath, 'utf-8');

    let newCode;

    switch (extname) {
      case 'vue':
        newCode = handleVueCode(code, this, name);
        break;

      case 'js':
        newCode = handleJavaScriptCode(code, this, name, false);
        break;

      default:
        return;
    }

    replace && (0, _fs2.exportFile)(filepath, newCode, {
      flag: 'w'
    });
  }

}

exports.default = LanguageUtils;