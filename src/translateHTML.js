import { parseHTML } from './parseHTML'
import { isChineseChar, codeReplace } from './utils/common'
import { parseTemplate } from './parseTemplate'

export default function translateHTML(html, languageUtils, exportName) {
  const tokens = []
  parseHTML(html, {
    expectHTML: true,
    shouldKeepComment: false,
    start(tag, attrs, unary, start, end) {
      if (attrs && attrs.length) {
        attrs.map(attr => {
          if (isChineseChar(attr.value)) {
            tokens.push({
              type: 'attribute',
              ...attr,
              tokens: parseTemplate(attr.value),
            })
          }
        })
      }
    },
    chars(text, start, end) {
      if (isChineseChar(text)) {
        tokens.push({
          type: 'chars',
          text,
          start,
          end,
          tokens: parseTemplate(text),
        })
      }
    },
  })

  const handleToken =
    USER_CONFIG.translateHTMLFun ||
    function (token, isInTemplate) {
      let value
      if (token.type === 'chars') {
        value = codeReplace(token.text, token.tokens, t => handleToken(t, true))
        return value
      }
      if (token.type === 'attribute') {
        value = codeReplace(token.value, token.tokens, t => handleToken(t, false))
        return `${token.name[0] === ':' ? '' : ':'}${token.name}="${value}"`
      }
      const params = (token.params || []).map(item => ({
        name: item.name,
        value: item.expression && codeReplace(item.expression, item.tokens, t => handleToken(t, false)),
      }))
      const identifier = languageUtils.stringToIdentifier(exportName, token.text, params)
      if (isInTemplate && token.type === 'text') {
        value = `{{ ${identifier} }}`
      } else {
        value = identifier
      }
      return value
    }

  html = codeReplace(html, tokens, handleToken)
  // console.log(html)

  return html
}
