// @ts-nocheck
export default {
  language: 'ini',
  init: (Prism: any) => {
    Prism.languages.ini = {
      comment: /^[ \t]*;.*$/m,
      selector: /^[ \t]*\[.*?\]/m,
      constant: /^[ \t]*[^\s=]+?(?=[ \t]*=)/m,
      'attr-value': {
        pattern: /=.*/,
        inside: {
          punctuation: /^[=]/,
        },
      },
    }
  },
}
