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
  lang: ' ',
  sitemap: { hostname: 'https://ashu-guo.github.io/blogs/' },
  head: [
    //   google
    ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-0H3Z4EZZYF' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', 'G-0H3Z4EZZYF');`,
    ],
    //   百度
    [
      'script',
      {},
      `var _hmt = _hmt || [];
      (function() {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js?1018dd87d1b5e3227f4af1ff2ea60dea";
        var s = document.getElementsByTagName("script")[0]; 
        s.parentNode.insertBefore(hm, s);
      })();`,
    ],
  ],
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
    search: {
      provider: 'algolia',
      options: {
        appId: 'ODV7UOFLSM',
        apiKey: '7fa3d227af67d13713ec1637cfb749f7',
        indexName: 'ashu-guoio',
      },
    },
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
