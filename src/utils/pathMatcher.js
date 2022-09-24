// Examples
// {namespaces}/{lang}.json
// {lang}/{namespace}/**/*.json
// something/{lang}/{namespace}/**/*.*
export function ParsePathMatcher (pathMatcher, exts = '') {
	let regstr = pathMatcher
		.replace(/\./g, '\\.')
		.replace('.*', '..*')
		.replace('*\\.', '.*\\.')
		.replace(/\/?\*\*\//g, '(?:.*/|^)')
		.replace('{locale}', '(?<locale>[\\w-_]+)')
		.replace('{locale?}', '(?<locale>[\\w-_]*?)')
		.replace('{namespace}', '(?<namespace>[^/\\\\]+)')
		.replace('{namespace?}', '(?<namespace>[^/\\\\]*?)')
		.replace('{namespaces}', '(?<namespace>.+)')
		.replace('{namespaces?}', '(?<namespace>.*?)')
		.replace('{ext}', `(?<ext>${exts})`)

	regstr = `^${regstr}$`

	return new RegExp(regstr)
}

export function ReplacePatchMatcher (pathMatcher, { locale, namespace, ext }) {
	return pathMatcher.replace('{locale}', locale).replace('{namespace}', namespace).replace('{ext}', ext)
}
