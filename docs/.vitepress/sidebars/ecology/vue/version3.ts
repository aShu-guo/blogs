export default {
  '/ecology/vue/3.x/': [
    {
      text: '概览',
      link: '/ecology/vue/3.x/',
      items: [
        { text: '启动流程', link: '/ecology/vue/3.x/setup/1-1-overview' },
        { text: 'createApp', link: '/ecology/vue/3.x/setup/1-2-createapp' },
        { text: 'mount', link: '/ecology/vue/3.x/setup/1-2-mount' },
        {
          text: '组件初始化',
          link: '/ecology/vue/3.x/setup/1-3-component-init',
          items: [
            { text: 'emits标准化', link: '/ecology/vue/3.x/setup/1-3.2-emits' },
            { text: 'props标准化', link: '/ecology/vue/3.x/setup/1-3.1-props' },
            { text: 'slots标准化', link: '/ecology/vue/3.x/setup/1-3.3-slots' },
            {
              text: 'directives标准化',
              link: '/ecology/vue/3.x/setup/1-3.4-directives',
            },
          ],
        },
        { text: 'setup', link: '/ecology/vue/3.x/setup/1-4-setup' },
        {
          text: 'setupRenderEffect',
          link: '/ecology/vue/3.x/setup/1-5-render-effect',
        },
        {
          text: '架构、数据结构和性能优化',
          link: '/ecology/vue/3.x/setup/1-6-architecture',
          items: [
            {
              text: 'shape-flags',
              link: '/ecology/vue/3.x/setup/1-6.1-shape-flags',
            },
            {
              text: 'slot-flags',
              link: '/ecology/vue/3.x/setup/1-6.3-slot-flags',
            },
            {
              text: 'block机制',
              link: '/ecology/vue/3.x/setup/1-6.2-block',
              items: [
                {
                  text: 'patch-flags',
                  link: '/ecology/vue/3.x/setup/1-6.4-patch-flags',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      text: '响应式模块 reactivity-module',
      items: [
        { text: '概览', link: '/ecology/vue/3.x/reactivity/index' },
        {
          text: 'Proxy详解',
          items: [
            {
              text: '规范',
              link: '/ecology/vue/3.x/reactivity/1-1.1-proxy-specification',
            },
            {
              text: '应用',
              link: '/ecology/vue/3.x/reactivity/1-1.2-proxy-utilize',
            },
            {
              text: 'Array',
              link: '/ecology/vue/3.x/reactivity/1-1.3-proxy-array',
            },
          ],
        },
        {
          text: 'Reflect详解',
          items: [
            {
              text: '规范',
              link: '/ecology/vue/3.x/reactivity/1-2.1-reflect-specification',
            },
            {
              text: '应用',
              link: '/ecology/vue/3.x/reactivity/1-2.2-reflect-utilize',
            },
          ],
        },
        {
          text: 'Effect系统',
          link: '/ecology/vue/3.x/reactivity/1-3-effect',
          items: [
            {
              text: '核心概念',
              link: '/ecology/vue/3.x/reactivity/1-3.1-effect-concepts',
            },
            {
              text: 'ReactiveEffect',
              link: '/ecology/vue/3.x/reactivity/1-3.2-effect-reactive-effect',
            },
            {
              text: 'Link 和 Dep 依赖链接机制',
              link: '/ecology/vue/3.x/reactivity/1-3.3-effect-link-dep',
            },
            {
              text: 'track() 和 trigger()',
              link: '/ecology/vue/3.x/reactivity/1-3.4-effect-track-trigger',
            },
            {
              text: 'Batch 机制',
              link: '/ecology/vue/3.x/reactivity/1-3.5-effect-batch',
            },
            {
              text: '清理机制（Dependencies Cleanup）',
              link: '/ecology/vue/3.x/reactivity/1-3.6-effect-cleanup',
            },
            {
              text: 'Scheduler（调度器）',
              link: '/ecology/vue/3.x/reactivity/1-3.7-effect-scheduler',
            },
            {
              text: 'EffectScope（作用域管理）',
              link: '/ecology/vue/3.x/reactivity/1-3.8-effect-scope',
            },
          ],
        },
        {
          text: 'ref',
          link: '/ecology/vue/3.x/reactivity/1-4.1-ref',
        },
        {
          text: 'reactive',
          link: '/ecology/vue/3.x/reactivity/1-4.2-reactive',
        },
        {
          text: 'computed',
          link: '/ecology/vue/3.x/reactivity/1-4.3-computed',
        },
        {
          text: 'watch',
          link: '/ecology/vue/3.x/reactivity/1-4.4-watch',
        },
        {
          text: 'watchEffect',
          link: '/ecology/vue/3.x/reactivity/1-4.5-watch-effect',
        },
      ],
    },
    {
      text: '编译模块 compile-module',
      link: '/ecology/vue/3.x/compiler/overview',
      items: [
        {
          text: 'Parser 模板解析模块',
          link: '/ecology/vue/3.x/compiler/2-1-parser-module',
          items: [
            {
              text: 'node-types',
              link: '/ecology/vue/3.x/compiler/2-1.1-node-types',
            },
            {
              text: 'error-codes',
              link: '/ecology/vue/3.x/compiler/2-1.2-error-codes',
            },
          ],
        },
        {
          text: 'AST 转换模块',
          link: '/ecology/vue/3.x/compiler/2-2-ast-transform-module',
          items: [
            {
              text: '内置指令及修饰符对照表',
              link: '/ecology/vue/3.x/compiler/directives',
            },
            {
              text: '内置transform',
              link: '/ecology/vue/3.x/compiler/2-2-ast-transform-module',
              items: [
                {
                  text: 'transform-bind',
                  link: '/ecology/vue/3.x/compiler/2-2.1-transform-bind',
                },
                {
                  text: 'transform-once',
                  link: '/ecology/vue/3.x/compiler/2-2.1-transform-once',
                },
                {
                  text: 'transform-if',
                  link: '/ecology/vue/3.x/compiler/2-2.1-transform-if',
                },
                {
                  text: 'transform-memo',
                  link: '/ecology/vue/3.x/compiler/2-2.1-transform-memo',
                },
                {
                  text: 'transform-expression',
                  link: '/ecology/vue/3.x/compiler/2-2.1-transform-exp',
                  items: [
                    {
                      text: 'inline模式',
                      link: '/ecology/vue/3.x/compiler/2-2.1-transform-exp-inline',
                    },
                  ],
                },
              ],
            },
            {
              text: 'error-codes',
              link: '/ecology/vue/3.x/compiler/2-2.2-error-codes',
            },
          ],
        },
        {
          text: 'Codegen 代码生成模块',
          link: '/ecology/vue/3.x/compiler/2-3-codegen-module',
        },
        {
          text: 'Compiler-core 编译核心模块',
          link: '/ecology/vue/3.x/compiler/2-4-compiler-core-module',
        },
        {
          text: '生态编译器扩展',
          link: '/ecology/vue/3.x/compiler/2-5-ecology-compilers',
        },

        {
          text: 'node-types',
          link: '/ecology/vue/3.x/compiler/1-1-node-types',
        },
        {
          text: '内置directives',
          link: '/ecology/vue/3.x/compiler/directives',
        },
      ],
    },
    {
      text: '渲染器模块 render-module',
      items: [
        { text: '响应式api', link: '/ecology/vue/3.x/renderer/chapter-1' },
      ],
    },
    {
      text: '优化',
      items: [
        {
          text: '编译时优化',
          link: '/ecology/vue/3.x/others/compile-optimize',
        },
        {
          text: '运行时优化',
          link: '/ecology/vue/3.x/others/runtime-optimize',
        },
        {
          text: 'Vite构建性能优化实践',
          link: '/ecology/vue/3.x/others/biz-vite-optimize',
        },
        {
          text: '与Vite协同',
          link: '/ecology/vue/3.x/others/vite-collaboration',
        },
        {
          text: 'weak-map',
          link: '/ecology/vue/3.x/others/weak-map',
        },
      ],
    },
    {
      text: '拓展',
      items: [
        { text: 'WeekMap', link: '/ecology/vue/3.x/others/weak-map' },
        {
          text: '与Vite协同',
          link: '/ecology/vue/3.x/others/vite-collaboration',
        },
      ],
    },
    {
      text: '一些优化技巧',
      items: [
        {
          text: '对象透传',
          link: '/ecology/vue/3.x/optimize/1-object-compute',
        },
      ],
    },
    {
      text: 'API实现解析',
      items: [
        { text: '响应式api', link: '/ecology/vue/3.x/reactivity-api' },
        { text: 'watch', link: '/ecology/vue/3.x/watch&watchEffect' },
        { text: '模板ref', link: '/ecology/vue/3.x/template-ref' },
      ],
    },
    {
      text: '其他',
      items: [{ text: '位操作', link: '/ecology/vue/3.x/bitwise-opt' }],
    },
  ],
};
