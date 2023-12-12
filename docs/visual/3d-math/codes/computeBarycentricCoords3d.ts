import { Vector3, Vector3Helper } from './Vector3';

/**
 * 通过投影减少自由度到2D的方式将3D坐标转化为重力空间坐标
 *
 * @param v 按照顺时针顺序排列好的三角形向量
 * @param p 3D空间中任意一点
 * @return b 转换后的重力空间下的坐标
 */
export function computeBarycentricCoords3d(
  v: [Vector3, Vector3, Vector3],
  p: Vector3,
): [number, number, number] | undefined {
  //   计算两个边向量，按顺时针方向
  const d1 = v[1].subtract(v[0]);
  const d2 = v[2].subtract(v[1]);

  // 计算出三角形平面的法向量
  // 不需要标准化
  const n = Vector3Helper.crossProduct(d1, d2);

  // 选择投影平面
  const max = Math.max(Math.abs(n.x), Math.abs(n.y), Math.abs(n.z));

  // 计算出子式
  let u1, u2, u3, u4;
  let v1, v2, v3, v4;

  switch (max) {
    case Math.abs(n.x):
      // 抛弃x，投影到yz平面
      u1 = v[0].y - v[2].y;
      u2 = v[1].y - v[2].y;
      u3 = p.y - v[0].y;
      u4 = p.y - v[2].y;

      v1 = v[0].z - v[2].z;
      v2 = v[1].z - v[2].z;
      v3 = p.z - v[0].z;
      v4 = p.z - v[2].z;
      break;
    case Math.abs(n.y):
      // 抛弃y，投影到xz平面
      u1 = v[0].z - v[2].z;
      u2 = v[1].z - v[2].z;
      u3 = p.z - v[0].z;
      u4 = p.z - v[2].z;

      v1 = v[0].x - v[2].x;
      v2 = v[1].x - v[2].x;
      v3 = p.x - v[0].x;
      v4 = p.x - v[2].x;
      break;
    case Math.abs(n.z):
      // 抛弃z，投影到xy平面
      u1 = v[0].x - v[2].x;
      u2 = v[1].x - v[2].x;
      u3 = p.x - v[0].x;
      u4 = p.x - v[2].x;

      v1 = v[0].y - v[2].y;
      v2 = v[1].y - v[2].y;
      v3 = p.y - v[0].y;
      v4 = p.y - v[2].y;
      break;
  }

  const denom = v1 * u2 - v2 * u1;
  if (denom !== 0) {
    const oneOverDenom = 1 / denom;
    const b1 = (v4 * u2 - v2 * u4) * oneOverDenom;
    const b2 = (v1 * u3 - v3 * u1) * oneOverDenom;
    const b3 = 1 - b1 - b2;
    return [b1, b2, b3];
  }
}
