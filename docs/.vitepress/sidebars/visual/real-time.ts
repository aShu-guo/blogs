export default {
  '/visual/real-time/': [
    {
      text: '实时通信技术',
      items: [
        {
          text: '前言',
          link: '/visual/real-time/',
        },
        {
          text: 'web worker',
          link: '/visual/real-time/web-worker-1',
          items:[
            {
              text: 'SharedWorker',
              link: '/visual/real-time/web-worker-2',
            },
          ]
        },
        {
          text: 'websocket',
          link: '/visual/real-time/web-socket-1',
        },
        {
          text: 'event stream',
          link: '/visual/real-time/event-steam-1',
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
