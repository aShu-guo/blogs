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
            { text: 'props标准化', link: '/ecology/vue/3.x/setup/1-3.1-props' },
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
      text: '响应式模块',
      items: [
        { text: '响应式api', link: '/ecology/vue/3.x/reactivity/chapter-1' },
      ],
    },
    {
      text: '编译模块',
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
                  text: 'transform-expression',
                  link: '/ecology/vue/3.x/compiler/2-2.1-transform-exp',
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
      text: '渲染器模块',
      items: [
        { text: '响应式api', link: '/ecology/vue/3.x/renderer/chapter-1' },
      ],
    },
    {
      text: '拓展',
      items: [{ text: 'WeekMap', link: '/ecology/vue/3.x/others/weak-map' }],
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
