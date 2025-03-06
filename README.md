## vue-auto-i18n

可以在vue/angular项目中使用，将vue中的template部分或者js/ts中的中文替换为vue-i18n的$t('xxx')，并生成对应的js/ts/json格式的文件。

## 配置说明

需要在项目根目录下新增一个`i18n.config.js`的配置文件，配置内容如下：

```js
module.exports = {
  sourceLanguage: 'zh-cn',
  localesPaths: ['test/vue/locale'],
  namespace: true,
  pathMatcher: '{locale}/{namespaces}.{ext}',
}
```

| 字段               | 说明                                                         |
| ------------------ | ------------------------------------------------------------ |
| sourceLanguage     | 读取中文后默认抽取到的语言目录名称                           |
| localesPaths       | 国际化配置（那些抽出来的语言JS/JSON）文件所在的目录          |
| namespace          | 是否有命名空间，主要是区分抽取的国际化文件是否按模块划分成多个文件载入还是全都放在一个文件中 |
| pathMatcher        | 匹配的文件目录格式，可以参考本项目中test/vue/locale文件夹下的目录结构 |
| ignoreFiles        | 可以配置需要忽略计入的文件                                   |
| stringToIdentifier | 可以根据自己的项目需求看要将中文替换成怎样的字符串，默认是替换为$t('xxx')这种格式<br />参数有如下几种：<br />stringToIdentifier = function (text, namespace, params, type) {}<br />* text：匹配到的中文字符<br />* namespace：有配置命名空间的话会返回抽取到的文件的命名空间<br />* params：如果这个文案是带动态参数的话会返回对应的参数<br />* type：vueTemplate 在vue template中匹配得到的 vueScript 在vue对应`<script>`定义中获取的，script 普通的script文件获取的 |
| translateMode      | vue/angular，内置兼容了两种框架的匹配                        |

## 使用方法

* `i18n-cli getlang <filepath> [namespace]`

  抽取指定文件目录，或文件夹目录下的所有vue/js/ts文件的中文，生成对应格式的国际化文件，可以指定生成的国际化文件的namespace命名。不会对原文件的中文进行替换

* `i18n-cli translate <filepath> [namespace]`

  抽取并替换指定文件目录或文件夹目录下的所有vue/js/ts文件的中文

* `i18n-cli toexcel`

  将项目下已有的国际化翻译导出为一个excel文件

* `i18n-cli tolocales <excelpath> [locales] [namespaces]`

  读取指定的excel目录文件，将其转换为项目需要的国际化翻译文件，可以指定只导出单独某个语言的翻译或者某个命名空间的翻译

* `i18n-cli search <text>`

  查找某个中文在项目中是否已存在已有的国际化翻译key，会输出所有查找到的内容，指定-`-f`可以采用模糊匹配
