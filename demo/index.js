const context = require.context('./', true, /^\.\/(?!index).*?\.js$/)

const modules = {}

context.keys().forEach(key => {
  const name = key.replace(/\.\/(.*)?\.js/, (str, $1) => $1)
  modules[name] = context(key).default
})

export default modules