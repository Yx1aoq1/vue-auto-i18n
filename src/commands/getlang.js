import fs from 'fs'
import path from 'path'
import { getExtname, getFilenameWithoutExt } from '../utils'
/**
 * 遍历文件夹
 */
function travel (src, ignore, callback) {
  fs.readdirSync(src).forEach(filename => {
    const filePath = path.join(src, filename)
    if (isIgnore(src, ignore, filePath)) return
    if (fs.statSync(filePath).isDirectory()) {
      travel(filePath, callback)
    } else {
      callback(filename, filePath)
    }
  })
} 

function handleCode (code) {

}

function isIgnore (src, ignore, filePath) {
  return ignore.reduce((res, curVal) => {
    const ignorePath = path.join(src, curVal)
    const isIgnore = ignorePath === filePath
    return res && isIgnore
  }, false)
}

export default function getlang (program) {
  program
    .command('getlang <src>')
    .description('对<src>目录下的.vue .js 文件进行中文收集')
    .option('-f, --filename <filename>', '输出文件名称')
    .option('-i, --ignore <dir>', '需要忽略的文件或文件夹', value => {
      return value.split(',')
    })
    .action((src, { filename, ignore }) => {
      travel(src, (filePath) => {
        const extname = getExtname(filePath)
        if (['vue', 'js'].includes(extname) && !isIgnore(src, ignore, filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          console.log(filePath, content)
        }
      })
    })
}