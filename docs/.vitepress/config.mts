import { defineConfig } from 'vitepress';
// 导出navs
import MvvmNavs from './navs/mvvm';
// 导出sidebars
import RfcTranslate from "./sidebars/mvvm/rfc-translate";
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'notes',
  description: 'A VitePress Site',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: 'Home', link: '/' }, { text: 'Examples', link: '/markdown-examples' }, ...MvvmNavs],

    sidebar: {
      ...RfcTranslate
    }/*[
      /!*{
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' },
        ],
      },*!/
    ]*/,

    socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }],
  },
});
