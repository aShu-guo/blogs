export default {
  '/courses/computer-organization/': [
    {
      text: '计算机组成原理',
      items: [
        {
          text: '前言',
          link: '/courses/computer-organization/',
        },
        {
          text: 'CPU',
          link: '/courses/computer-organization/cpu',
        },
        {
          text: '缓存系统',
          link: '/courses/computer-organization/cache/',
          items:[
            {
              text: 'DMA',
              link: '/courses/computer-organization/cache/dma',
            },
          ]
        },
        {
          text: 'IO',
          link: '/courses/computer-organization/io',
        },
        {
          text: 'BUS总线',
          link: '/courses/computer-organization/bus',
        },
      ],
    },
  ],
};
