import { defineConfig } from 'vitepress';
// 导出navs
import MvvmNavs from './navs/ecology';
// 导出sidebars
import RfcTranslate from './sidebars/ecology/vue/rfc-translate';
import Version2 from './sidebars/ecology/vue/version2';
import Version3 from './sidebars/ecology/vue/version3';
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'notes',
  description: 'A VitePress Site',
  base: '/blog/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    outline: 'deep',
    nav: [{ text: 'Home', link: '/' }, { text: 'Examples', link: '/markdown-examples' }, ...MvvmNavs],
    sidebar: {
      ...RfcTranslate,
      ...Version2,
      ...Version3,
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }],
  },
});
