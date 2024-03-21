import { defineConfig } from 'vitepress';
// 导出navs
import MvvmNavs from './navs/ecology';
import BaseNavs from './navs/base';
import CoursesNavs from './navs/courses';
import ServerNavs from './navs/server';
import HybridAppNavs from './navs/hybrid-app';
import VisualNavs from './navs/visual';
import LifeNavs from './navs/life';
// 导出sidebars
import RfcTranslate from './sidebars/ecology/vue/rfc-translate';
import Version2 from './sidebars/ecology/vue/version2';
import Version3 from './sidebars/ecology/vue/version3';
import Nuxt from './sidebars/ecology/vue/nuxt';
import Network from './sidebars/base/network';
import Css from './sidebars/base/css';
import Git from './sidebars/base/version-control';
import ComputerOrganization from './sidebars/courses/computer-organization';
import C11 from './sidebars/courses/c11';
import Containerization from './sidebars/server/containerization';
import Database from './sidebars/server/database';
import Nest from './sidebars/server/nest';
import Math from './sidebars/visual/3d-math';
import ComputerGraphics from './sidebars/visual/computer-graphics';
import JavaScript from './sidebars/base/js';
import TypeScript from './sidebars/base/ts';
import ThreeJs from './sidebars/visual/threejs';
import Exam from './sidebars/life/exam';
import Pregnancy from './sidebars/life/pregnancy';

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
    [
      'script',
      {
        async: '',
        src: 'https://www.googletagmanager.com/gtag/js?id=G-0H3Z4EZZYF',
      },
    ],
    [
      'meta',
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
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
    // 支持mathJax
    math: true,
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
    nav: [
      ...BaseNavs,
      ...MvvmNavs,
      ...CoursesNavs,
      ...VisualNavs,
      ...ServerNavs,
      ...HybridAppNavs,
      ...LifeNavs,
    ],
    sidebar: {
      ...RfcTranslate,
      ...Version2,
      ...Version3,
      ...Nuxt,
      ...Network,
      ...Css,
      ...Git,
      ...ComputerOrganization,
      ...C11,
      ...Containerization,
      ...Network,
      ...Database,
      ...ComputerGraphics,
      ...Nest,
      ...Math,
      ...JavaScript,
      ...TypeScript,
      ...ThreeJs,
      ...Exam,
      ...Pregnancy,
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/aShu-guo/blogs' },
    ],
  },
});
