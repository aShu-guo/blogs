import { loadOml2d } from 'oh-my-live2d';

export const initOml2d = () => {
  if (!import.meta.env.SSR) {
    loadOml2d({
      menus: {
        items: [],
      },
      statusBar: { disable: true },
      tips: {
        style: {
          top: '-50px',
        },
      },
      models: [
        {
          path: 'https://model.oml2d.com/cat-white/model.json',
          // scale: 0.15,
          position: [0, 20],
          // stageStyle: {
          //   height: 250,
          // },
        },
      ],
    });
  }
};
