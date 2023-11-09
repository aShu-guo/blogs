export default {
  '/base/version-control/': [
    {
      text: '版本控制工具',
      items: [
        {
          text: 'git',
          items: [
            {
              text: '前言',
              link: '/base/version-control/git/',
            },
            {
              text: '什么是git',
              link: '/base/version-control/git/what',
            },
            {
              text: '仓库结构',
              link: '/base/version-control/git/repo',
            },
            {
              text: '分支操作',
              items: [
                { text: '基础', link: '/base/version-control/git/branch-base' },
                { text: '进阶', link: '/base/version-control/git/branch-advance' },
              ],
            },
            {
              text: '撤销',
              link: '/base/version-control/git/reset',
            },
          ],
        },
        {
          text: 'svn',
          items: [
            {
              text: '前言',
              link: '/base/version-control/svn/',
            },
          ],
        },
      ],
    },
  ],
};
