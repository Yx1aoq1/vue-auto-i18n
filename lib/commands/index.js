"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = run;

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _fs = _interopRequireDefault(require("fs"));

var _context, _context2;

let commands = [];
(0, _forEach.default)(_context = (0, _filter.default)(_context2 = _fs.default.readdirSync(__dirname)).call(_context2, fileName => fileName !== 'index.js')).call(_context, fileName => {
  let command = require('./' + fileName).default;

  commands.push(command);
});

function run(program) {
  (0, _forEach.default)(commands).call(commands, command => command(program));
}