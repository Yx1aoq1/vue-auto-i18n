"use strict";

var _WeakMap = require("@babel/runtime-corejs3/core-js-stable/weak-map");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = getlang;

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _promise2 = require("core-js/fn/promise");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireWildcard(require("path"));

var _readline = _interopRequireDefault(require("readline"));

var _utils = require("../utils");

function _getRequireWildcardCache(nodeInterop) { if (typeof _WeakMap !== "function") return null; var cacheBabelInterop = new _WeakMap(); var cacheNodeInterop = new _WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = _Object$defineProperty && _Object$getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? _Object$getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { _Object$defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * 遍历文件夹
 */
function travel(src, ignore, callback) {
  var _context;

  (0, _forEach.default)(_context = _fs.default.readdirSync(src)).call(_context, filename => {
    // 忽略
    if (isIgnore(ignore, filename)) return; // 判断是否为文件夹

    const filepath = _path.default.join(src, filename);

    if (isDirectory(filepath)) {
      travel(filepath, ignore, callback);
    } else {
      callback(filepath);
    }
  });
}

function isIgnore(ignore, filename) {
  return (0, _includes.default)(ignore).call(ignore, filename);
}

function isDirectory(filepath) {
  return _fs.default.statSync(filepath).isDirectory();
}

function handleCode(filepath) {
  return new _promise.default((resolve, reject) => {
    const rl = _readline.default.createInterface({
      input: _fs.default.createReadStream(fullPath)
    });

    let lineIdx = 0;
    rl.on('line', line => {
      lineIdx++;
      console.log('line', line);
    });
    rl.on('close', () => {
      resolve();
    });
  });
}

function getlang(program) {
  program.command('getlang <src>').description('对<src>目录下的.vue .js 文件进行中文收集').option('-f, --filename <filename>', '输出文件名称').option('-i, --ignore <dir>', '需要忽略的文件或文件夹', value => {
    return value.split(',');
  }).action((src, {
    filename,
    ignore = []
  }) => {
    travel(src, ignore, filepath => {
      var _context2;

      const extname = (0, _utils.getExtname)(filepath); // 仅处理vue & js文件

      if ((0, _includes.default)(_context2 = ['vue', 'js']).call(_context2, extname)) {
        handleCode(filepath);
      }
    });
  });
}