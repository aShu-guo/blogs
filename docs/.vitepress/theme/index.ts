import DefaultTheme from 'vitepress/theme';
import { nextTick, onMounted, toRefs, watch } from 'vue';
import { EnhanceAppContext, Theme, useData, useRoute } from 'vitepress';
import mediumZoom from 'medium-zoom';
import giscusTalk from 'vitepress-plugin-comment-with-giscus';
import 'virtual:group-icons.css';
import vitepressNprogress from 'vitepress-plugin-nprogress';
import 'vitepress-plugin-nprogress/lib/css/index.css';

import './style/index.css';

export default {
  ...DefaultTheme,
  async enhanceApp(ctx: EnhanceAppContext) {
    const router = ctx.router;
    // extend default theme custom behaviour.
    DefaultTheme.enhanceApp(ctx);

    vitepressNprogress(ctx);

    if (!import.meta.env.SSR) {
      const { loadOml2d } = await import('oh-my-live2d');

      loadOml2d({
        menus: {
          items: [],
        },
        statusBar: { disable: true },
        tips: {
          style: {
            top: '-50px',
          },
        },
        models: [
          {
            path: 'https://model.oml2d.com/cat-white/model.json',
            // scale: 0.15,
            position: [0, 20],
            // stageStyle: {
            //   height: 250,
            // },
          },
        ],
      });
    }
  },
  setup() {
    const route = useRoute();

    // 初始化图片查看器
    const initZoom = () => {
      // mediumZoom('[data-zoomable]', { background: 'var(--vp-c-bg)' });
      mediumZoom('.main img', { background: 'var(--vp-c-bg)' });
    };
    onMounted(() => {
      initZoom();
    });
    watch(
      () => route.path,
      () => nextTick(() => initZoom()),
    );

    const { frontmatter } = toRefs(useData());
    // Obtain configuration from: https://giscus.app/
    giscusTalk(
      {
        repo: 'aShu-guo/giscus-discussions',
        repoId: 'R_kgDOJThJwQ',
        category: 'General', // default: `General`
        categoryId: 'DIC_kwDOJThJwc4CVlrP',
        mapping: 'title', // default: `pathname`
        inputPosition: 'bottom', // default: `top`
        // lang: 'en', // default: `zh-CN`
        // i18n setting (Note: This configuration will override the default language set by lang)
        // Configured as an object with key-value pairs inside:
        // [your i18n configuration name]: [corresponds to the language pack name in Giscus]
        locales: {
          'zh-Hans': 'zh-CN',
          'en-US': 'en',
        },
        homePageShowComment: false, // Whether to display the comment area on the homepage, the default is false
        lightTheme: 'light', // default: `light`
        darkTheme: 'transparent_dark', // default: `transparent_dark`
        // ...
      },
      {
        frontmatter,
        route,
      },
      // Whether to activate the comment area on all pages.
      // The default is true, which means enabled, this parameter can be ignored;
      // If it is false, it means it is not enabled.
      // You can use `comment: true` preface to enable it separately on the page.
      true,
    );
  },
} satisfies Theme;
