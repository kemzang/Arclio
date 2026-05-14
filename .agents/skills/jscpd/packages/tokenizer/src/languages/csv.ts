// @ts-nocheck
export default {
  language: 'csv',
  init: (Prism: any) => {    // https://tools.ietf.org/html/rfc4180

    Prism.languages.csv = {
    	'value': /[^\r\n,"]+|"(?:[^"]|"")*"(?!")/,
    	'punctuation': /,/
    };

  },
};
