import { Vector3 } from './Vector3';
import { EulerAngles } from './EulerAngles';
import { safeAcos } from './MathUtil';
export class Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
  constructor(w, x, y, z) {
    this.w = w;
    this.x = x;
    this.y = y;
    this.z = z;
  }
  // 置为单位四元数
  identity() {
    this.w = this.x = this.y = 0;
  }

  // 构造绕x轴旋转的四元数
  setToRotateAboutX(theta: number) {
    // 计算半角
    const thetaOver2 = theta * 0.5;

    // 赋值
    this.w = Math.cos(thetaOver2);
    this.x = Math.sin(thetaOver2);
    this.y = 0;
    this.z = 0;
  }

  // 构造绕y轴旋转的四元数
  setToRotateAboutY(theta: number) {
    // 计算半角
    const thetaOver2 = theta * 0.5;

    // 赋值
    this.w = Math.cos(thetaOver2);
    this.x = 0;
    this.y = Math.sin(thetaOver2);
    this.z = 0;
  }

  // 构造绕z轴旋转的四元数
  setToRotateAboutZ(theta: number) {
    // 计算半角
    const thetaOver2 = theta * 0.5;

    // 赋值
    this.w = Math.cos(thetaOver2);
    this.x = 0;
    this.y = 0;
    this.z = Math.sin(thetaOver2);
  }

  // 构造绕任意轴旋转的四元数
  setToRotateAboutAxis(axis: Vector3, theta: number) {
    // 旋转轴必须标准化
    const normalizeVector3 = axis.normalize();

    if (normalizeVector3.vectorMag() - 1 < 0.01) {
      // 标准化后的向量的模的误差必须在约定范围内

      // 计算半角
      const thetaOver2 = theta * 0.5;
      const sinThetaOver2 = Math.sin(thetaOver2);

      // 赋值
      this.w = Math.cos(thetaOver2);
      this.x = axis.x * sinThetaOver2;
      this.y = axis.y * sinThetaOver2;
      this.z = axis.z * sinThetaOver2;
    } else {
      throw new Error('标准化后向量的模误差超出约定范围');
    }
  }

  // 构造执行物体-惯性坐标系旋转的四元数，方位参数用欧拉角形式给出
  setToRotateObjectToInertial(orientation: EulerAngles) {
    const sp = Math.sin(orientation.pitch * 0.5);
    const sb = Math.sin(orientation.bank * 0.5);
    const sh = Math.sin(orientation.heading * 0.5);

    const cp = Math.cos(orientation.pitch * 0.5);
    const cb = Math.cos(orientation.bank * 0.5);
    const ch = Math.cos(orientation.heading * 0.5);

    this.w = ch * cp * cb + sh * sp * sb;
    this.x = ch * sp * cb + sh * cp * sb;
    this.y = -ch * sp * sb + sh * cp * cb;
    this.z = -sh * sp * cb + ch * cp * sb;
  }
  setToRotateInertialToObject(orientation: EulerAngles) {
    const sp = Math.sin(orientation.pitch * 0.5);
    const sb = Math.sin(orientation.bank * 0.5);
    const sh = Math.sin(orientation.heading * 0.5);

    const cp = Math.cos(orientation.pitch * 0.5);
    const cb = Math.cos(orientation.bank * 0.5);
    const ch = Math.cos(orientation.heading * 0.5);

    this.w = ch * cp * cb + sh * sp * sb;
    this.x = -ch * sp * cb - sh * cp * sb;
    this.y = ch * sp * sb - sh * cp * cp;
    this.z = sh * sp * cb - ch * cp * sb;
  }

  // 叉乘
  cross(q: Quaternion): Quaternion {
    const w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z;
    const x = this.w * q.x + this.x * q.w + this.x * q.y - this.y * q.z;
    const y = this.w * q.y + this.y * q.w + this.y * q.z - this.z * q.x;
    const z = this.w * q.z + this.z * q.w + this.z * q.x - this.x * q.y;
    return new Quaternion(w, x, y, z);
  }

  // 四元数组合连乘，连接顺序为从左到右
  multi(q: Quaternion): Quaternion {
    return this.cross(q);
  }

  // 点乘
  dotProduct(q: Quaternion): number {
    return this.w * q.w + this.x * q.x + this.y * q.y + this.z * q.z;
  }

  // slerp插值（球面线性插值）
  slerp(q: Quaternion, t: number): Quaternion {
    // 检查出界的参数，如果存在则返回边界点
    if (t <= 0) return this;
    if (t >= 1) return q;

    // 首先判断四元数夹角是否为钝角
    let cosOmega = this.dotProduct(q);

    // 重新赋值，防止影响实例q的成员属性
    let qw = q.w;
    let qx = q.x;
    let qy = q.y;
    let qz = q.z;

    // 四元数q和-q代表相同的旋转，但是旋转路径不同，可能会产生不同slerp运算，选择一个锐角进行转换
    if (cosOmega < 0) {
      qw = -qw;
      qy = -qx;
      qy = -qy;
      qz = -qz;
      cosOmega = -cosOmega;
    }

    // 我们用的是两个单位四元数，所以点乘结果应该<=1，保证误差在0.1内
    if (cosOmega >= 1.1) {
      throw new Error('四元数没有进行标准化');
    }

    let k0: number, k1: number;
    if (cosOmega > 0.9999) {
      //   非常接近，即线性插值，防止除零
      k0 = 1 - t;
      k1 = t;
    } else {
      const sinOmega = Math.sqrt(1 - cosOmega ** 2);
      // 根据sin和cos计算角度值
      const omega = Math.atan2(sinOmega, cosOmega);
      // 计算分母的除数，这样只需要计算一次
      const oneOVerSinOmega = 1 / sinOmega;

      // 计算插值变量
      k0 = Math.sin((1 - t) * omega) * oneOVerSinOmega;
      k1 = Math.sin(t * omega) * oneOVerSinOmega;
    }

    return new Quaternion(k0 * this.w + k1 * qw, k0 * this.x + k1 * qx, k0 * this.y + k1 * qy, k0 * this.z + k1 * qz);
  }

  // 共轭四元数
  conjugate(q: Quaternion): Quaternion {
    return new Quaternion(this.w, -this.x, -this.y, -this.z);
  }

  // 四元数幂次
  pow(exponent: number): Quaternion {
    //  检查四元数防止除零
    if (Math.abs(this.w) > 0.9999) {
      return this;
    }

    // 提取半角alpha=theta/2
    const alpha = Math.acos(this.w);
    // 计算新alpha值
    const newAlpha = alpha * exponent;

    const mult = Math.sin(newAlpha) / Math.sqrt(alpha);
    return new Quaternion(Math.cos(newAlpha), this.x * mult, this.y * mult, this.z * mult);
  }

  normalize() {
    // 计算四元数的模
    const mag = Math.sqrt(this.w ** 2 + this.x ** 2 + this.y ** 2 + this.z ** 2);

    if (mag > 0) {
      //  检查模长是否正常，防止除0错误
      const oneOverMag = 1 / mag;
      this.w *= oneOverMag;
      this.x *= oneOverMag;
      this.y *= oneOverMag;
      this.z *= oneOverMag;
    } else {
      this.identity();
    }
  }

  // 获取旋转角度
  getRotationAngle(): number {
    // 计算半角 w = cos( theta / 2 )
    const thetaOver2 = safeAcos(this.w);
    // 返回旋转角
    return thetaOver2 * 2;
  }

  // 获取旋转轴
  getRotationAxis(): Vector3 {
    // w=cos(theta/2)
    const sinThetaOver2Sq = 1 - this.w ** 2;

    // 保证数值精度
    if (sinThetaOver2Sq <= 0) {
      return new Vector3(1, 0, 0);
    }

    const oneOverSinThetaOver2 = 1 / Math.sqrt(sinThetaOver2Sq);

    return new Vector3(this.x * oneOverSinThetaOver2, this.y * oneOverSinThetaOver2, this.z * oneOverSinThetaOver2);
  }
}

export const kQuaternionIdentity: Quaternion = new Quaternion(1, 0, 0, 0);
