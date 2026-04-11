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
              text: '现场速查',
              link: '/base/version-control/git/cheatsheet',
            },
            {
              text: '什么是 Git',
              link: '/base/version-control/git/what',
            },
            {
              text: '仓库结构与提交流程',
              link: '/base/version-control/git/repo',
            },
            {
              text: '分支操作',
              items: [
                { text: '基础', link: '/base/version-control/git/branch-base' },
                {
                  text: '协作进阶',
                  link: '/base/version-control/git/branch-advance',
                },
              ],
            },
            {
              text: '撤销与回退',
              link: '/base/version-control/git/reset',
            },
            {
              text: '高级操作',
              items: [
                { text: 'stash', link: '/base/version-control/git/stash' },
                { text: 'rebase', link: '/base/version-control/git/rebase' },
                {
                  text: 'cherry-pick',
                  link: '/base/version-control/git/cherry-pick',
                },
                { text: 'reflog', link: '/base/version-control/git/reflog' },
                { text: 'tag', link: '/base/version-control/git/tag' },
              ],
            },
            {
              text: '决策与排错',
              items: [
                {
                  text: 'merge vs rebase',
                  link: '/base/version-control/git/merge-rebase',
                },
                { text: 'bisect', link: '/base/version-control/git/bisect' },
              ],
            },
            {
              text: '协作约定',
              link: '/base/version-control/git/collaboration',
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
            {
              text: '现场速查',
              link: '/base/version-control/svn/cheatsheet',
            },
            {
              text: '先把脑回路切过来',
              link: '/base/version-control/svn/what',
            },
            {
              text: '工作副本与提交流程',
              link: '/base/version-control/svn/working-copy',
            },
            {
              text: '主干、分支、标签',
              link: '/base/version-control/svn/branch',
            },
            {
              text: '高级操作',
              items: [
                { text: 'switch', link: '/base/version-control/svn/switch' },
                { text: 'merge', link: '/base/version-control/svn/merge' },
                { text: 'cleanup', link: '/base/version-control/svn/cleanup' },
                { text: '锁与属性', link: '/base/version-control/svn/lock' },
              ],
            },
            {
              text: '协作约定',
              link: '/base/version-control/svn/collaboration',
            },
          ],
        },
      ],
    },
  ],
};
