"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = getConfig;

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

const cwd = process.cwd();

function getConfigFile(file) {
  return _fs.default.existsSync(_path.default.join(cwd, file)) ? _path.default.join(cwd, file) : false;
}
/**
 * 获取用户配置文件
 */


function getConfig() {
  let cfg = {};
  const configPath = getConfigFile(global.CONFIG_FILE_NAME);

  if (configPath) {
    delete require.cache[require.resolve(configPath)];
    cfg = require(configPath);
  } else {
    logger.error(`配置文件不存在，请在项目根目录下新增${global.CONFIG_FILE_NAME}文件！`);
    process.exit(1);
  }

  return cfg;
}