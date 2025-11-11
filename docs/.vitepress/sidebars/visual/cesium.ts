export default {
  '/visual/webgis/cesium/': [
    {
      text: 'Cesium',
      items: [
        {
          text: '前言',
          link: '/visual/webgis/cesium/',
        },
        {
          text: '集成three',
          link: '/visual/webgis/cesium/integration-threejs',
        },
        {
          text: '3dTiles',
          link: '/visual/webgis/cesium/3dtiles/',
          items: [
            {
              text: 'CustomShader',
              link: '/visual/webgis/cesium/3dtiles/custom-shader',
            },
          ],
        },
        {
          text: '事件体系',
          link: '/visual/webgis/cesium/chapter-1',
          items: [
            {
              text: '事件链路概览',
              link: '/visual/webgis/cesium/chapter-1.1',
            },
            {
              text: 'ScreenSpaceEventHandler',
              link: '/visual/webgis/cesium/chapter-1.2',
            },
            {
              text: 'CameraEventAggregator',
              link: '/visual/webgis/cesium/chapter-1.3',
            },
            {
              text: 'ScreenSpaceCameraController',
              link: '/visual/webgis/cesium/chapter-1.4',
            },
          ],
        },
      ],
    },
    {
      text: '功能拓展',
      items: [
        {
          text: '获取裁切面',
          link: '/visual/webgis/cesium/extension/clip-plane',
        },
      ],
    },
  ],
};
