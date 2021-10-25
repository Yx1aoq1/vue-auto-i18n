"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = run;

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var commands = [];

_fs["default"].readdirSync(__dirname).filter(function (fileName) {
  return fileName !== 'index.js';
}).forEach(function (fileName) {
  var command = require('./' + fileName)["default"];

  commands.push(command);
});

function run(program) {
  commands.forEach(function (command) {
    return command(program);
  });
}