import { defineConfig } from 'vitepress';
// 导出navs
import MvvmNavs from './navs/ecology';
import BaseNavs from './navs/base';
import CoursesNavs from './navs/courses';
import ServerNavs from './navs/server';
import HybridAppNavs from './navs/hybrid-app';
// 导出sidebars
import RfcTranslate from './sidebars/ecology/vue/rfc-translate';
import Version2 from './sidebars/ecology/vue/version2';
import Version3 from './sidebars/ecology/vue/version3';
import Nuxt from './sidebars/ecology/vue/nuxt';
import Network from './sidebars/base/network';
import Css from './sidebars/base/css';
import Git from './sidebars/base/version-control';
import ComputerOrganization from './sidebars/courses/computer-organization';
import Containerization from './sidebars/server/containerization';
import Database from './sidebars/server/database';
import ComputerGraphics from './sidebars/courses/computer-graphics';
import Nest from './sidebars/server/nest';
// 支持mathJax
import mathjax3 from 'markdown-it-mathjax3';
import { customElements } from './customElements';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Blogs',
  description: 'A VitePress Site',
  base: '/blogs/',
  lastUpdated: true,
  sitemap: { hostname: 'https://ashu-guo.github.io/blogs/' },
  markdown: {
    config: (md) => {
      md.use(mathjax3);
    },
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => customElements.includes(tag),
      },
    },
  },
  themeConfig: {
    logo: { dark: '/logo-dark.jpeg', light: '/logo.jpeg' },
    // https://vitepress.dev/reference/default-theme-config
    outline: 'deep',
    editLink: {
      pattern: 'https://github.com/aShu-guo/blogs/tree/master/docs/:path',
    },
    search: { provider: 'local' },
    nav: [...MvvmNavs, ...BaseNavs, ...CoursesNavs, ...ServerNavs, ...HybridAppNavs],
    sidebar: {
      ...RfcTranslate,
      ...Version2,
      ...Version3,
      ...Nuxt,
      ...Network,
      ...Css,
      ...Git,
      ...ComputerOrganization,
      ...Containerization,
      ...Network,
      ...Database,
      ...ComputerGraphics,
      ...Nest,
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/aShu-guo/blogs' }],
  },
});
