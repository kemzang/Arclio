// @ts-nocheck
export default {
  language: 'txt',
  init: (Prism: any) => {

    Prism.languages.txt = {
      'word': /\S+/,
    };

  },
};
