import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { getExtname, getFilenameWithoutExt } from '../utils'

const CHINESE_REG = /[\u4E00-\u9FA5\uF900-\uFA2D]+[\u4E00-\u9FA5\uF900-\uFA2D\uff01\uff08-\uff1f\u3001-\u3015\u0020a-zA-Z\d\\\/+*/-]*/
const lang = {}
/**
 * 遍历文件夹
 */
function travelDir (src, ignore, callback) {
  fs.readdirSync(src).forEach(filename => {
    // 忽略
    if (isIgnore(ignore, filename)) return
    // 判断是否为文件夹
    const filepath = path.join(src, filename)
    if (isDirectory(filepath)) {
      travelDir(filepath, ignore, callback)
    } else {
      callback(filepath)
    }
  })
}

function isIgnore (ignore, filename) {
  return ignore.includes(filename)
}

function isDirectory (filepath) {
  return fs.statSync(filepath).isDirectory()
}

function handleCode (filepath) {
  return new Promise ((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filepath)
    })
    let isNote = false
    rl.on('line', line => {
      // console.log('line:', line)
      let content = isNote ? '' : line
      if (line.includes('/*')) {
        isNote = true
        content = line.slice(0, line.indexOf('/*'))
      }
      if (line.includes('*/')) {
        if (isNote) {
          isNote = false
          content = line.slice(line.indexOf('*/') + 2)
        }
      }
      if (line.includes('<!--')) {
        isNote = true
        content = line.slice(0, line.indexOf('<!--'))
      }
      if (line.includes('-->')) {
        if (isNote) {
          isNote = false
          content = line.slice(line.indexOf('-->') + 3)
        }
      }
      if (isNote && !content) return
      if (line.includes('//')) content = line.slice(0, line.indexOf('//'))
      let str = content.match(CHINESE_REG)
      console.log('str:', str)
    })
  })
}

export default function getlang (program) {
  program
    .command('getlang <src>')
    .description('对<src>目录下的.vue .js 文件进行中文收集')
    .option('-f, --filename <filename>', '输出文件名称')
    .option('-i, --ignore <dir>', '需要忽略的文件或文件夹', value => {
      return value.split(',')
    })
    .action((src, { filename, ignore = [] }) => {
      travelDir(src, ignore, (filepath) => {
        const extname = getExtname(filepath)
        if (['vue', 'js'].includes(extname)) {
          handleCode(filepath)
        }
      })
    })
}