export const kPi = Math.PI;
export const k2Pi = kPi * 2;
export const kPiOver2 = kPi / 2;
export const k1OverPi = 1 / kPi;
export const k1Over2Pi = 1 / k2Pi;

// 通过加上适当的2pi倍数，将角度限制在-pi到pi的区间
export const wrapPi = (theta: number): number => {
  theta += kPi;
  theta -= Math.floor(theta * k1Over2Pi) * k2Pi;
  theta -= kPi;
  return theta;
};

// 相较于直接使用Math.acos，添加了边界校验，返回值在0到pi之间
export const safeAcos = (x: number): number => {
  //  检查边界条件
  if (x <= -1) {
    return kPi;
  }
  if (x >= 1) {
    return 0;
  }
  return Math.acos(x);
};
