import { EulerAngles } from './EulerAngles';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

export class RotationMatrix {
  m11: number;
  m12: number;
  m13: number;
  m21: number;
  m22: number;
  m23: number;
  m31: number;
  m32: number;
  m33: number;

  constructor(
    m11?: number,
    m12?: number,
    m13?: number,
    m21?: number,
    m22?: number,
    m23?: number,
    m31?: number,
    m32?: number,
    m33?: number,
  ) {
    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
  }

  // 置为单位矩阵
  identity() {
    this.m11 = 1;
    this.m12 = 0;
    this.m13 = 0;
    this.m21 = 0;
    this.m22 = 1;
    this.m23 = 0;
    this.m31 = 0;
    this.m32 = 0;
    this.m33 = 1;
  }

  // 根据指定的方位构造矩阵
  setup(orientation: EulerAngles) {
    const sh = Math.sin(orientation.heading);
    const sp = Math.sin(orientation.pitch);
    const sb = Math.sin(orientation.bank);

    const ch = Math.sin(orientation.heading);
    const cp = Math.sin(orientation.pitch);
    const cb = Math.sin(orientation.bank);

    this.m11 = ch * cb + sh * sp * sb;
    this.m12 = -ch * sb + sh * sp * cb;
    this.m13 = sh * cp;

    this.m21 = sb * cp;
    this.m22 = cb * cp;
    this.m23 = -sp;

    this.m31 = -sh * cb + ch * sp * sb;
    this.m32 = sb * sh + ch * sp * cb;
    this.m33 = ch * cp;
  }

  // 根据四元数构造矩阵，假设该四元数参数代表指定方向的变换
  fromInertialToObjectQuaternion(q: Quaternion) {
    this.m11 = 1 - 2 * (q.y * q.y + q.z * q.z);
    this.m12 = 2 * (q.x * q.y + q.w * q.z);
    this.m13 = 2 * (q.x * q.z - q.w * q.y);

    this.m21 = 2 * (q.x * q.y - q.w * q.z);
    this.m22 = 1 - 2 * (q.x * q.x + q.z * q.z);
    this.m23 = 2 * (q.y * q.z + q.w * q.x);

    this.m31 = 2 * (q.x * q.z + q.w * q.y);
    this.m32 = 2 * (q.y * q.z - q.w * q.x);
    this.m33 = 1 - 2 * (q.x * q.x + q.y * q.y);
  }
  // 根据物体-惯性旋转四元数构造矩阵
  fromObjectToInertialQuaternion(q: Quaternion) {
    this.m11 = 1 - 2 * (q.y * q.y + q.z * q.z);
    this.m12 = 2 * (q.x * q.y - q.w * q.z);
    this.m13 = 2 * (q.x * q.z + q.w * q.y);

    this.m21 = 2 * (q.x * q.y + q.w * q.z);
    this.m22 = 1 - 2 * (q.x * q.x + q.z * q.z);
    this.m23 = 2 * (q.y * q.z - q.w * q.x);

    this.m31 = 2 * (q.x * q.z - q.w * q.y);
    this.m32 = 2 * (q.y * q.z + q.w * q.x);
    this.m33 = 1 - 2 * (q.x * q.x + q.y * q.y);
  }

  // 执行旋转
  // 对向量做惯性--物体转换
  inertialToObject(v: Vector3): Vector3 {
    // 以“标准”方式执行矩阵乘法
    return new Vector3(
      this.m11 * v.x + this.m21 * v.y + this.m31 * v.z,
      this.m12 * v.x + this.m22 * v.y + this.m32 * v.z,
      this.m13 * v.x + this.m23 * v.y + this.m33 * v.z,
    );
  }

  // 对向量做物体--惯性转换
  objectToInertial(v: Vector3): Vector3 {
    // 乘以转置
    return new Vector3(
      this.m11 * v.x + this.m12 * v.y + this.m13 * v.z,
      this.m21 * v.x + this.m22 * v.y + this.m23 * v.z,
      this.m31 * v.x + this.m32 * v.y + this.m33 * v.z,
    );
  }
}
