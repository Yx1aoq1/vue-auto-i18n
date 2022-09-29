function test() {
  console.log('测试中文匹配1')
  console.log('测试中文匹配2')
}
const txt1 = '测试中文匹配3'
const txt2 = '测试中文匹配4'
const txt3 = `模板语法${txt1}测试`
// 备注
function iconPath(icon) {
  const baseUrl = window.globalConfig.baseUrl
  retrun`${baseUrl}/app/test/${icon}`
}
/**
 * 测试备注
 */
const htmlTemp = `
<div>中心</div>
<!-- 注释 -->
<div>${txt1}</div>
`
