"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = run;

var _commands = _interopRequireDefault(require("./commands"));

var _commander = _interopRequireDefault(require("commander"));

var _package = require("../package.json");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

_commander["default"].version(_package.version);

(0, _commands["default"])(_commander["default"]);

function run(argv) {
  // 如果没有其他命令的话
  console.log(argv);

  if (!argv[2]) {
    _commander["default"].help();

    return;
  }

  _commander["default"].parse(argv);
}