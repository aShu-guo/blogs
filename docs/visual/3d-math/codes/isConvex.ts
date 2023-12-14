import { Vector3 } from './Vector3';
import { kPi, safeAcos } from './MathUtil';

/**
 * 多边形凹凸性判断
 *
 * @param v1 多边形点集合
 */
export function isConvex(v1: Vector3[]) {
  // 最小角度值之和
  let angleSum = 0;

  const n = v1.length;
  for (let i = 0; i < n; i++) {
    // 注意第一个和最后一个点的计算规则

    let e1: Vector3;
    if (i === 0) {
      e1 = v1[n - 1].subtract(v1[i]);
    } else {
      e1 = v1[i - 1].subtract(v1[i]);
    }

    let e2: Vector3;
    if (i === n - 1) {
      e2 = v1[0].subtract(v1[i]);
    } else {
      e2 = v1[i + 1].subtract(v1[i]);
    }

    e1.normalize();
    e2.normalize();

    const dot = e1.multiply(e2) as number;

    const theta = safeAcos(dot);
    angleSum += theta;
  }

  // 计算内角和
  const convexAngleSum = (n - 2) * kPi;
  // 判断凹凸性，并允许一部分精度误差
  return angleSum >= convexAngleSum - n * 0.0001;
}
