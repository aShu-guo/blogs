export default {
  '/visual/real-time/': [
    {
      text: '服务器push技术',
      items: [
        {
          text: '前言',
          link: '/visual/real-time/',
        },
        {
          text: '轮询',
          link: '/visual/real-time/polling',
          items:[
            {
              text: 'Worker',
              link: '/visual/real-time/web-worker-1',
            },
            {
              text: 'SharedWorker',
              link: '/visual/real-time/web-worker-2',
            },
          ]
        },
        {
          text: 'WebSocket',
          link: '/visual/real-time/web-socket',
        },
        {
          text: 'SSE',
          link: '/visual/real-time/event-steam',
        },
      ],
    },
    {
      text: '用例',
      items:[
        {
          text: '无人机实时位置标注',
          link: '/visual/real-time/examples/example-1',
        },
        {
          text: '飞行历史回溯',
          link: '/visual/real-time/examples/example-2',
        },
      ],
    },
  ],
};
