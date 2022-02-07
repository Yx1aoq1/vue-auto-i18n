export const CHINESE_REG = /[^\x00-\xff]+[^\<\>\"\'\`]*/g
export const VARIABLE_REG = /\$?\{?\{([a-zA-Z][a-zA-Z\d]*)\}?\}/g
export const CONSOLE_REG = /console\.log\(.*\)/g
export const QUOTE_REG = /\'(.*?)\'|\"(.*?)\"|\`(.*?)\`/g