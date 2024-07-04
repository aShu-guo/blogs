export default {
  '/courses/data-structure/': [
    {
      text: '数据结构',
      items: [
        {
          text: '前言',
          link: '/courses/data-structure/',
        },
        {
          text: '绪论',
          link: '/courses/data-structure/chapter-1',
        },
        {
          text: '线性表',
          link: '/courses/data-structure/chapter-2',
          items:[
            {
              text: '双指针算法',
              link: '/courses/data-structure/chapter-2.1',
            },
          ]
        },
      ],
    },
    {
      text: '拓展',
      items: [
        {
          text: '如何分析算法复杂度-1？',
          link: '/courses/data-structure/how-to-get-o(n)-1',
        },
        {
          text: '如何分析算法复杂度-2？',
          link: '/courses/data-structure/how-to-get-o(n)-2',
        },
      ],
    },
  ],
};
