export default {
  '/visual/3d-math/': [
    {
      text: '3D数学基础',
      items: [
        {
          text: '前言',
          link: '/visual/3d-math/',
        },
        {
          text: '笛卡尔坐标系',
          link: '/visual/3d-math/2-chapter',
        },
        {
          text: '多坐标系',
          link: '/visual/3d-math/3-chapter',
        },
        {
          text: '向量',
          link: '/visual/3d-math/4-chapter',
        },
        {
          text: '3D向量类',
          link: '/visual/3d-math/5-chapter',
        },
        {
          text: '矩阵',
          link: '/visual/3d-math/6-chapter',
        },
        {
          text: '矩阵与线性变换',
          link: '/visual/3d-math/7-chapter',
          items: [
            { text: '旋转', link: '/visual/3d-math/7.1-chapter' },
            { text: '放缩', link: '/visual/3d-math/7.2-chapter' },
            { text: '正交投影', link: '/visual/3d-math/7.3-chapter' },
            { text: '镜像', link: '/visual/3d-math/7.4-chapter' },
            { text: '切变', link: '/visual/3d-math/7.5-chapter' },
            { text: '变换的组合', link: '/visual/3d-math/7.6-chapter' },
          ],
        },
        {
          text: '矩阵的更多知识',
          items: [
            { text: '行列式', link: '/visual/3d-math/8.1-chapter' },
            { text: '矩阵的逆', link: '/visual/3d-math/8.2-chapter' },
            { text: '正交矩阵', link: '/visual/3d-math/8.3-chapter' },
            { text: '4x4齐次矩阵', link: '/visual/3d-math/8.4-chapter' },
          ],
        },
        {
          text: '3D中的方位与角位移',
          link: '/visual/3d-math/9-chapter',
          items: [
            { text: '矩阵', link: '/visual/3d-math/9.1-chapter' },
            { text: '欧拉角', link: '/visual/3d-math/9.2-chapter' },
            {
              text: '四元数',
              link: '/visual/3d-math/9.3-chapter',
              items: [
                { text: '复数', link: '/visual/3d-math/9.3.1-chapter' },
                { text: '四元数', link: '/visual/3d-math/9.3.2-chapter' },
              ],
            },
            { text: '总结', link: '/visual/3d-math/9.4-chapter' },
          ],
        },
        {
          text: '代码实现',
          link: '/visual/3d-math/10-chapter',
          items: [
            { text: 'EulerAngles', link: '/visual/3d-math/10.1-chapter' },
            { text: 'Quaternion', link: '/visual/3d-math/10.2-chapter' },
            { text: 'RotationMatrix', link: '/visual/3d-math/10.3-chapter' },
            { text: 'Matrix4x3', link: '/visual/3d-math/10.4-chapter' },
          ],
        },
        {
          text: '几何图元',
          link: '/visual/3d-math/11-chapter',
          items: [
            { text: '直线和射线', link: '/visual/3d-math/11.1-chapter' },
            { text: '球和圆', link: '/visual/3d-math/11.2-chapter' },
            { text: '矩形边界框', link: '/visual/3d-math/11.3-chapter' },
            { text: '平面', link: '/visual/3d-math/11.4-chapter' },
            { text: '三角形', link: '/visual/3d-math/11.5-chapter' },
            { text: '多边形', link: '/visual/3d-math/11.6-chapter' },
          ],
        },
        {
          text: '几何检测',
          link: '/visual/3d-math/12-chapter',
          items: [
            {
              text: '最近点',
              link: '/visual/3d-math/12.1-chapter',
              items: [
                { text: '直线和平面上的最近点', link: '/visual/3d-math/12.1.1-chapter' },
                { text: '参数射线上的最近点', link: '/visual/3d-math/12.1.2-chapter' },
                { text: '圆或球上的最近点', link: '/visual/3d-math/12.1.3-chapter' },
                { text: 'AABB上的最近点', link: '/visual/3d-math/12.1.4-chapter' },
              ],
            },
            {
              text: '相交性检测',
              link: '/visual/3d-math/12.2-chapter',
              items: [
                { text: '两条隐式直线', link: '/visual/3d-math/12.2.1-chapter' },
                { text: '平面与其他图元', link: '/visual/3d-math/12.2.2-chapter' },
                { text: '射线与其他图元', link: '/visual/3d-math/12.2.3-chapter' },
                { text: '圆/球与其他图元', link: '/visual/3d-math/12.2.4-chapter' },
                { text: 'aabb与其他图元', link: '/visual/3d-math/12.2.5-chapter' },
                { text: '其他种类的相交性检测', link: '/visual/3d-math/12.2.6-chapter' },
              ],
            },
          ],
        },
      ],
    },
  ],
};
