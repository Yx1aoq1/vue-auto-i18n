"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.run = run;

require("./global");

var _config = _interopRequireDefault(require("./utils/config"));

var _commands = _interopRequireDefault(require("./commands"));

var _commander = _interopRequireDefault(require("commander"));

var _package = require("../package.json");

_commander.default.version(_package.version);

(0, _commands.default)(_commander.default);

function run(argv) {
  // 如果没有其他命令的话
  if (!argv[2]) {
    _commander.default.help();

    return;
  } // 用户配置


  global.USER_CONFIG = (0, _config.default)();

  _commander.default.parse(argv);
}