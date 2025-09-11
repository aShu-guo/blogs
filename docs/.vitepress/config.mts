// 导出navs
import MvvmNavs from './navs/ecology';
import BaseNavs from './navs/base';
import CoursesNavs from './navs/courses';
import ServerNavs from './navs/server';
import HybridAppNavs from './navs/hybrid-app';
import VisualNavs from './navs/visual';
import LifeNavs from './navs/life';
import Optimization from './navs/optimization';
// 导出sidebars
import RfcTranslate from './sidebars/ecology/vue/rfc-translate';
import Version2 from './sidebars/ecology/vue/version2';
import Version3 from './sidebars/ecology/vue/version3';
import Problems from './sidebars/ecology/vue/problems';
import ReactVsVue from './sidebars/ecology/react-vs-vue';
import Nuxt from './sidebars/ecology/vue/nuxt';
import Interview from './sidebars/ecology/react/interview';
import Css from './sidebars/base/css';
import Git from './sidebars/base/version-control';
import Npm from './sidebars/base/npm';
import ComputerOrganization from './sidebars/courses/computer-organization';
import C11 from './sidebars/courses/c11';
import DataStructure from './sidebars/courses/data-structure';
import Network from './sidebars/courses/network';
import Containerization from './sidebars/server/containerization';
import Database from './sidebars/server/database';
import Nest from './sidebars/server/nest';
import Math from './sidebars/visual/3d-math';
import GIS from './sidebars/visual/gis';
import WebGL from './sidebars/visual/webgl';
import OpenLayers from './sidebars/visual/openLayers';
import Cesium from './sidebars/visual/cesium';
import RealTimeTech from './sidebars/visual/real-time';
import ComputerGraphics from './sidebars/visual/computer-graphics';
import JavaScript from './sidebars/base/js';
import TypeScript from './sidebars/base/ts';
import ThreeJs from './sidebars/visual/threejs';
import Exam from './sidebars/life/exam';
import Finance from './sidebars/life/finance';
import Pregnancy from './sidebars/life/pregnancy';
import OptimizationIndex from './sidebars/optimization/index';
import { withMermaid } from 'vitepress-plugin-mermaid';
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons';

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: 'Blogs',
  description: 'A VitePress Site',
  // base: '/blogs/',
  lastUpdated: true,
  lang: ' ',
  sitemap: { hostname: 'https://blog.ashuguo.me/' },
  mermaid: {
    // refer https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults for options
  },
  // optionally set additional config for plugin itself with MermaidPluginConfig
  mermaidPlugin: {
    class: 'mermaid my-class', // set additional css classes for parent container
  },
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
    config(md) {
      md.use(groupIconMdPlugin);
    },
  },
  vite: {
    plugins: [groupIconVitePlugin()],
  },
  vue: {},
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
        appId: '1NHJHSLIQL',
        apiKey: 'd7b0f7826136dd1d65e829ac5b48fff0',
        indexName: 'ashuguo',
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
      ...Optimization,
    ],
    sidebar: {
      ...RfcTranslate,
      ...Version2,
      ...Version3,
      ...Problems,
      ...ReactVsVue,
      ...Nuxt,
      ...Interview,
      ...Css,
      ...Git,
      ...Npm,
      ...ComputerOrganization,
      ...C11,
      ...DataStructure,
      ...Containerization,
      ...Network,
      ...Database,
      ...ComputerGraphics,
      ...Nest,
      ...Math,
      ...GIS,
      ...WebGL,
      ...OpenLayers,
      ...Cesium,
      ...RealTimeTech,
      ...JavaScript,
      ...TypeScript,
      ...ThreeJs,
      ...Exam,
      ...Finance,
      ...Pregnancy,
      ...OptimizationIndex,
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/aShu-guo/blogs' },
    ],
  },
});
