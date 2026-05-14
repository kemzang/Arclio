// @ts-nocheck
export default {
  language: 'properties',
  init: (Prism: any) => {
    Prism.languages.properties = {
      comment: /^[ \t]*[#!].*$/m,
      'attr-value': {
        pattern: /(^[ \t]*(?:\\(?:\r\n|[\s\S])|[^\\\s:=])+?(?: *[=:] *| ))(?:\\(?:\r\n|[\s\S])|[^\\\r\n])+/m,
        lookbehind: true,
      },
      'attr-name': /^[ \t]*(?:\\(?:\r\n|[\s\S])|[^\\\s:=])+?(?= *[=:] *| )/m,
      punctuation: /[=:]/,
    }
  },
}
