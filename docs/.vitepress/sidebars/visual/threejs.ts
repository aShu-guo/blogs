export default {
  '/visual/three/': [
    {
      text: 'Three学习',
      items: [
        { text: '前言', link: '/visual/three/' },
        {
          text: '入门与调试',
          link: '/visual/three/chapter-1',
          items: [
            { text: 'gsap', link: '/visual/three/chapter-1.1' },
            { text: 'dat.gui', link: '/visual/three/chapter-1.2' },
          ],
        },
        { text: '几何体', link: '/visual/three/chapter-2' },
        {
          text: '材质和纹理',
          link: '/visual/three/chapter-3',
          items: [
            { text: '纹理', link: '/visual/three/chapter-3.1' },
            { text: '色彩空间', link: '/visual/three/chapter-3.2' },
          ],
        },
        { text: 'PBR', link: '/visual/three/chapter-4' },
        { text: '阴影与灯光', link: '/visual/three/chapter-5' },
      ],
    },
  ],
};
