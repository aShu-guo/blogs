export default {
  '/base/js/': [
    {
      text: '重学JavaScript',
      items: [
        { text: '前言', link: '/base/js/' },
        { text: '词法结构', link: '/base/js/2-chapter' },
        { text: '类型、值和变量', link: '/base/js/3-chapter' },
        { text: '表达式与操作符', link: '/base/js/4-chapter' },
        { text: '模块', link: '/base/js/10-chapter' },
        { text: '异步', link: '/base/js/13-chapter' },
        {
          text: '元编程',
          link: '/base/js/14-chapter',
          items: [{ text: 'Proxy', link: '/base/js/14.1-chapter' }],
        },
      ],
    },
    {
      text: '拓展',
      items: [
        { text: 'delete关键字', link: '/base/js/delete' },
        { text: '闭包与垃圾回收', link: '/base/js/closure与gc' },
        { text: 'BigInt与IEEE-754', link: '/base/js/safe-number' },
        { text: 'regenerator', link: '/base/js/regenerator' },
        { text: 'Unicode与ASCII', link: '/base/js/unicode与ascii' },
        { text: '手动实现继承', link: '/base/js/extends' },
        {
          text: 'setInterval与requestFrame',
          link: '/base/js/setInterval-vs-requestframe',
        },
        { text: '解构', link: '/base/js/unconstruct' },
      ],
    },
  ],
};
