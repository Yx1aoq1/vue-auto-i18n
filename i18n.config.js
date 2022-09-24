module.exports = {
	// 语言配置
	languages: [ 'zh-cn', 'en' ],
	sourceLanguage: 'zh-cn',
	localesPaths: [ 'test/vue/locale' ],
	outputLocalesPath: './output/locale',
	namespace: true,
	pathMatcher: '{locale}/{namespaces}.{ext}',
	importI18nFunction: "import i18n from '@/plugins/i18n'"
}
