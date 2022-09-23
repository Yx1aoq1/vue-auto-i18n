import { JsonParser } from './json'
import { EcmascriptParser } from './ecmascript'

export const AvailableParsers = [new JsonParser(), new EcmascriptParser('js')]
