export default {
  '/courses/c11/': [
    {
      text: 'C语言',
      link: '/courses/c11/',
      items: [
        {
          text: '词汇',
          link: '/courses/c11/chapter-1',
        },
        {
          text: '类型',
          link: '/courses/c11/chapter-2',
          items: [
            {
              text: '基本类型',
              link: '/courses/c11/chapter-2.1',
            },
            {
              text: '引用类型',
              link: '/courses/c11/chapter-2.2',
              items: [
                {
                  text: 'struct',
                  link: '/courses/c11/chapter-2.2.1',
                },
                {
                  text: '数组',
                  link: '/courses/c11/chapter-2.2.2',
                },
                {
                  text: 'union',
                  link: '/courses/c11/chapter-2.2.3',
                },
                {
                  text: 'enum',
                  link: '/courses/c11/chapter-2.2.4',
                },
              ],
            },
            {
              text: '类型转换',
              link: '/courses/c11/chapter-2.3',
            },
            {
              text: 'void类型',
              link: '/courses/c11/chapter-2.4',
            },

          ],
        },
        {
          text: '输入与输出',
          link: '/courses/c11/chapter-3',
        },
        {
          text: '循环与分支',
          link: '/courses/c11/chapter-4',
          items:[
            {
              text: '分支结构',
              link: '/courses/c11/chapter-4.1',
            },
            {
              text: '循环结构',
              link: '/courses/c11/chapter-4.2',
            },
          ]
        },
        {
          text: '函数',
          link: '/courses/c11/chapter-4',
        },
        {
          text: '指针',
          link: '/courses/c11/chapter-5',
        },
      ],
    },
  ],
};
