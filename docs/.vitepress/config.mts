import { defineConfig } from 'vitepress';
// 导出navs
import MvvmNavs from './navs/mvvm';
// 导出sidebars
import RfcTranslate from './sidebars/mvvm/rfc-translate';
import Version2 from './sidebars/mvvm/version2';
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'notes',
  description: 'A VitePress Site',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    outline: 'deep',
    nav: [{ text: 'Home', link: '/' }, { text: 'Examples', link: '/markdown-examples' }, ...MvvmNavs],
    sidebar: {
      ...RfcTranslate,
      ...Version2,
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }],
  },
});
