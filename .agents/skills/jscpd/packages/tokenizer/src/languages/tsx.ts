// @ts-nocheck
export default {
  language: 'tsx',
  init: (Prism: any) => {
    const typescript = Prism.util.clone(Prism.languages.typescript)
    Prism.languages.tsx = Prism.languages.extend('jsx', typescript)
  },
}
