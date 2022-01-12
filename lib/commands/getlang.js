"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = getlang;

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _readline = _interopRequireDefault(require("readline"));

var _common = require("../utils/common");

var _fs2 = require("../utils/fs");

const CHINESE_REG = /[^\x00-\xff]+[^\<\>\"\'\`]*/g;
const VARIABLE_REG = /\$?\{?\{([a-zA-Z][a-zA-Z\d]*)\}?\}/g;
const CONSOLE_REG = /console\.log\(.*\)/g;
/**
 * 遍历文件夹
 */

function travelDir(src, ignore, callback) {
  var _context;

  (0, _forEach.default)(_context = _fs.default.readdirSync(src)).call(_context, filename => {
    // 忽略
    if (isIgnore(ignore, filename)) return; // 判断是否为文件夹

    const filepath = _path.default.join(src, filename);

    if ((0, _fs2.isDirectory)(filepath)) {
      travelDir(filepath, ignore, callback);
    } else {
      callback(filepath);
    }
  });
}

function isIgnore(ignore, filename) {
  return (0, _includes.default)(ignore).call(ignore, filename);
}

function handleCode(filepath) {
  const zhs = [];
  return new _promise.default((resolve, reject) => {
    const rl = _readline.default.createInterface({
      input: _fs.default.createReadStream(filepath)
    });

    let isNote = false;
    rl.on('line', line => {
      let content = isNote ? '' : line.replace(CONSOLE_REG, '');

      if ((0, _includes.default)(line).call(line, '/*')) {
        isNote = true;
        content = (0, _slice.default)(line).call(line, 0, (0, _indexOf.default)(line).call(line, '/*'));
      }

      if ((0, _includes.default)(line).call(line, '*/')) {
        if (isNote) {
          isNote = false;
          content = (0, _slice.default)(line).call(line, (0, _indexOf.default)(line).call(line, '*/') + 2);
        }
      }

      if ((0, _includes.default)(line).call(line, '<!--')) {
        isNote = true;
        content = (0, _slice.default)(line).call(line, 0, (0, _indexOf.default)(line).call(line, '<!--'));
      }

      if ((0, _includes.default)(line).call(line, '-->')) {
        if (isNote) {
          isNote = false;
          content = (0, _slice.default)(line).call(line, (0, _indexOf.default)(line).call(line, '-->') + 3);
        }
      }

      if (isNote && !content) return;
      if ((0, _includes.default)(line).call(line, '//')) content = (0, _slice.default)(line).call(line, 0, (0, _indexOf.default)(line).call(line, '//'));
      const matchs = content.match(CHINESE_REG);

      while (matchs && matchs.length) {
        const str = matchs.pop().replace(VARIABLE_REG, '{$1}');

        if (!(0, _includes.default)(zhs).call(zhs, str)) {
          zhs.push(str);
        }
      }
    });
    rl.on('close', () => {
      resolve(zhs);
    });
  });
}

function getlang(program) {
  program.command('getlang <src>').description('对<src>目录下的.vue .js 文件进行中文收集').option('-d, --dir <exportDir>', '输出文件位置').option('-f, --filename <filename>', '输出文件名称').option('-i, --ignore <dir>', '需要忽略的文件或文件夹', value => {
    return value.split(',');
  }).action(async (src, {
    dir = '.',
    filename = 'zh',
    ignore = []
  }) => {
    getConfig();
    const fileList = [];
    travelDir(src, ignore, filepath => {
      var _context2;

      const extname = (0, _common.getExtname)(filepath);

      if ((0, _includes.default)(_context2 = ['vue', 'js']).call(_context2, extname)) {
        fileList.push(filepath);
      }
    });
    const lang = {};

    for (const filepath of fileList) {
      const zhs = await handleCode(filepath);
      lang[filepath] = (0, _reduce.default)(zhs).call(zhs, (res, cur, idx) => {
        res[(0, _common.getRandomStr)()] = cur;
        return res;
      }, {});
    }

    console.log(lang);

    const transPath = _path.default.join(process.cwd(), `${dir}/${filename}.json`);

    _fs.default.writeFileSync(transPath, (0, _stringify.default)(lang, null, 2), {
      flag: 'w'
    });
  });
}