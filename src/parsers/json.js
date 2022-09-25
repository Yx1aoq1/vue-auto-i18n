import { Parser } from './base'

export class JsonParser extends Parser {
	id = 'json'

	constructor () {
		super([ 'json' ], 'json')
	}

	async parse (text) {
		if (!text || !text.trim()) return {}
		return JSON.parse(text)
	}

	async dump (object) {
		const indent = 2
		return `${JSON.stringify(object, null, indent)}\n`
	}
}
