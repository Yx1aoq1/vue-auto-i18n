import fs from 'fs'
import path from 'path'
import LanguageUtils from '../language'
import translateHTML from '../translateHTML'
import translateJS from '../translateJS'
import { getExtname } from '../utils/common'
import { exportFile, isDirectory } from '../utils/fs'
import * as vueCompiler from 'vue-template-compiler'
import Stringify from 'vue-sfc-descriptor-stringify'
import cloneDeep from 'lodash.clonedeep'

function handleVueCode (code, languageUtils, exportName) {
  const originSfcDescriptor = vueCompiler.parseComponent(code)
  const sfcDescriptor = cloneDeep(originSfcDescriptor)
  sfcDescriptor.template.content = handleTemplateCode(sfcDescriptor.template.content, languageUtils, exportName)
  sfcDescriptor.script.content = handleJavaScriptCode(sfcDescriptor.script.content, languageUtils, exportName)
  
  return Stringify(sfcDescriptor, originSfcDescriptor)
}

function handleTemplateCode (code, languageUtils, exportName) {
  // 该文件代码是否忽略国际化
  if (isIgnore(code)) {
    return code
  }
  return translateHTML(code, languageUtils, exportName)
}

function handleJavaScriptCode (code, languageUtils, exportName, isVue) {
  // 该文件代码是否忽略国际化
  if (isIgnore(code)) {
    return code
  }
  return translateJS(code, languageUtils, exportName, isVue)
}

/**
 * 如果代码中包含 i18nIgnore 关键字，则该文件忽略国际化
 * @param {*} code
 */
function isIgnore(code) {
  return code.includes('i18nIgnore')
}

/**
 * 遍历文件夹
 */
function travelDir (src, callback) {
  fs.readdirSync(src).forEach(filename => {
    // 判断是否为文件夹
    const filepath = path.join(src, filename)
    if (isDirectory(filepath)) {
      travelDir(filepath, callback)
    } else {
      callback(filepath)
    }
  })
}



export default function transalte (program) {
  program
    .command('translate <filepath> <exportName> [lang]')
    .description('对<filepath>文件进行中文提取，提取至<exportName>文件中')
    .action((filepath, exportName, lang = 'zh-cn') => {
      function handleSingleFile (filepath) {
        const extname = getExtname(filepath)
        const code = fs.readFileSync(filepath, 'utf-8')
        // vue单文件处理
        let newCode
        switch (extname) {
          case 'vue':
            newCode = handleVueCode(code, languageUtils, exportName)
            break
          case 'js':
            newCode = handleJavaScriptCode(code, languageUtils, exportName, false)
            break
          default:
            return
        }
        exportFile(filepath, newCode, { flag: 'w' })
      }
      const languageUtils = new LanguageUtils(lang)
      // 验证目录存在
			try {
        fs.accessSync(filepath, fs.constants.F_OK)
      } catch (error) {
        logger.error(`${filepath}文件或目录不存在`)
        process.exit()
      }
      const extname = getExtname(filepath)
      // 单文件处理
			if (['vue', 'js'].includes(extname)) {
        handleSingleFile(filepath)
        languageUtils.exportFile(exportName)
      } else {
      // 文件夹处理
        travelDir(filepath, (path) => {
          const ext = getExtname(path)
          if (['vue', 'js'].includes(ext)) {
            handleSingleFile(path)
          }
        })
        languageUtils.exportFile(exportName)
      }
    })
}