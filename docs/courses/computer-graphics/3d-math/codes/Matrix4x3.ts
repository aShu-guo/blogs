import { Vector3 } from './Vector3';
import { EulerAngles } from './EulerAngles';
import { RotationMatrix } from './RotationMatrix';
import { Quaternion } from './Quaternion';

// 约定：1-绕x轴旋转、2-绕y轴旋转、3-绕z轴旋转
type Axis = 1 | 2 | 3;

export default class Matrix4x3 {
  m11: number;
  m12: number;
  m13: number;

  m21: number;
  m22: number;
  m23: number;

  m31: number;
  m32: number;
  m33: number;

  tx: number;
  ty: number;
  tz: number;

  constructor(
    m11: number,
    m12: number,
    m13: number,
    m21: number,
    m22: number,
    m23: number,
    m31: number,
    m32: number,
    m33: number,
    tx: number,
    ty: number,
    tz: number,
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
    this.tx = tx;
    this.ty = ty;
    this.tz = tz;
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
    this.tx = 0;
    this.ty = 0;
    this.tz = 1;
  }

  // 直接访问平移部分
  private zeroTranslation() {
    // 将平移部分置为0
    this.tx = this.ty = this.tz = 0;
  }
  private setTranslation(v: Vector3) {
    // 赋值给平移部分
    this.tx = v.x;
    this.ty = v.y;
    this.tz = v.z;
  }
  setupTranslation(v: Vector3) {
    this.zeroTranslation();
    this.setTranslation(v);
  }

  /**
   * 构造执行局部空间->父空间变换的矩阵，假定局部空间在指定的位置和方位，
   * 1. 该位可能是使用欧拉角或旋转矩阵表示的
   * 2. 常用于构造物体->世界的变换矩阵
   * 3. 物体->惯性->世界
   *
   * @param pos
   * @param orient
   */
  setupLocalToParent(pos: Vector3, orient: EulerAngles | RotationMatrix) {
    let rawOrient: RotationMatrix;
    if (orient instanceof EulerAngles) {
      // 根据欧拉角构造旋转矩阵
      rawOrient = new RotationMatrix();
      rawOrient.setup(orient);
    } else {
      rawOrient = orient;
    }

    this.m11 = rawOrient.m11;
    this.m12 = rawOrient.m21;
    this.m13 = rawOrient.m33;

    this.m21 = rawOrient.m12;
    this.m22 = rawOrient.m22;
    this.m23 = rawOrient.m32;

    this.m31 = rawOrient.m13;
    this.m32 = rawOrient.m23;
    this.m33 = rawOrient.m33;

    this.tx = pos.x;
    this.ty = pos.y;
    this.tz = pos.z;
  }

  /**
   * 构造执行父空间->局部空间变换的矩阵
   * 1. 该位可能是使用欧拉角或旋转矩阵表示的
   * 2. 常用于构造世界->物体的变换矩阵
   * 3. 世界->惯性->物体（4x3矩阵可以完成惯性->物体的变换）
   *
   * @param pos
   * @param orient
   */
  setupParentToLocal(pos: Vector3, orient: EulerAngles | RotationMatrix) {
    let rawOrient: RotationMatrix;
    if (orient instanceof EulerAngles) {
      rawOrient = new RotationMatrix();
      rawOrient.setup(orient);
    } else {
      rawOrient = orient;
    }

    this.m11 = rawOrient.m11;
    this.m12 = rawOrient.m12;
    this.m13 = rawOrient.m13;

    this.m21 = rawOrient.m21;
    this.m22 = rawOrient.m22;
    this.m23 = rawOrient.m23;

    this.m31 = rawOrient.m31;
    this.m32 = rawOrient.m32;
    this.m33 = rawOrient.m33;

    // 一般来说，从世界空间到惯性空间只需平移坐标负的量
    // 但必须记得旋转是“先”发生的，所以应该旋转平移部分
    // 这个先创建平移-pos的矩阵T，再创建旋转矩阵R，再把他们连接成TR是一样的
    this.tx = -(pos.x * this.m11 + pos.y * this.m21 + pos.z * this.m31);
    this.ty = -(pos.x * this.m12 + pos.y * this.m22 + pos.z * this.m32);
    this.tz = -(pos.x * this.m13 + pos.y * this.m23 + pos.z * this.m33);
  }

  /**
   *
   * @param axis 约定：1-绕x轴旋转、2-绕y轴旋转、3-绕z轴旋转
   * @param theta 旋转角度，用弧度表示
   */
  setupRotate(axis: Axis | Vector3, theta: number) {
    const s = Math.sin(theta);
    const c = Math.cos(theta);

    if (axis instanceof Vector3) {
      // 构造绕任意轴旋转的矩阵
      if (Math.abs(axis.vectorMag() - 1) > 0.01) {
        throw new Error('旋转轴向量不是单位向量');
      }
      const a = 1 - c;
      const ax = a * axis.x;
      const ay = a * axis.y;
      const az = a * axis.z;

      this.m11 = ax * axis.x + c;
      this.m12 = ax * axis.y + axis.z * s;
      this.m13 = ax * axis.z - axis.y * s;

      this.m21 = ay * axis.x - axis.z * s;
      this.m22 = ay * axis.y + c;
      this.m23 = ay * axis.z + axis.x * s;

      this.m31 = az * axis.x + axis.y * s;
      this.m32 = az * axis.y - axis.x * s;
      this.m33 = az * axis.z + c;

      this.tx = this.ty = this.tz = 0;
    } else {
      // 构造绕坐标轴旋转的矩阵
      switch (axis) {
        case 1:
          // 绕x轴
          this.m11 = 1;
          this.m12 = 0;
          this.m13 = 0;

          this.m21 = 0;
          this.m22 = c;
          this.m23 = s;

          this.m31 = 0;
          this.m32 = -s;
          this.m33 = c;
          break;
        case 2:
          // 绕y轴
          this.m11 = c;
          this.m12 = 0;
          this.m13 = -s;

          this.m21 = 0;
          this.m22 = 1;
          this.m23 = 0;

          this.m31 = s;
          this.m32 = 0;
          this.m33 = c;
          break;
        case 3:
          // 绕z轴
          this.m11 = c;
          this.m12 = s;
          this.m13 = 0;

          this.m21 = -s;
          this.m22 = c;
          this.m23 = 0;

          this.m31 = 0;
          this.m32 = 0;
          this.m33 = 1;
          break;
      }
      // 平移部分为0
      this.tx = this.ty = this.tz = 0;
    }
  }

  // 构造旋转矩阵，角位移由四元数形式给出
  fromQuaternion(q: Quaternion) {
    const ww = 2 * q.w;
    const xx = 2 * q.x;
    const yy = 2 * q.y;
    const zz = 2 * q.z;

    this.m11 = 1 - yy * q.y - zz * q.z;
    this.m12 = xx * q.y + ww * q.z;
    this.m13 = xx * q.z - ww * q.x;

    this.m21 = xx * q.y - ww * q.z;
    this.m22 = 1 - xx * q.x - zz * q.z;
    this.m23 = yy * q.z + ww * q.x;

    this.m31 = xx * q.z + ww * q.y;
    this.m32 = yy * q.z - ww * q.x;
    this.m33 = 1 - xx * q.x - yy * q.y;

    this.tx = this.ty = this.tz = 0;
  }

  /**
   * 构造沿坐标轴缩放的矩阵
   *
   * 1. 缩放因子k，用矩阵Vector3(k1,k2,k3)表示
   *
   * @param v
   */
  setupScale(v: Vector3) {
    this.m11 = v.x;
    this.m12 = 0;
    this.m13 = 0;

    this.m21 = 0;
    this.m22 = v.y;
    this.m23 = 0;

    this.m31 = 0;
    this.m32 = 0;
    this.m33 = v.z;

    this.tx = this.ty = this.tz = 0;
  }

  // 构造沿任意轴缩放的矩阵
  setupScaleAlongAxis(axis: Vector3, k: number) {
    if (Math.abs(axis.vectorMag() - 1) >= 0.01) {
      throw new Error('旋转轴向量没有标准化');
    }

    const a = k - 1;
    const ax = a * axis.x;
    const ay = a * axis.y;
    const az = a * axis.z;

    this.m11 = ax * axis.x + 1;
    this.m22 = ay * axis.y + 1;
    this.m32 = az * axis.z + 1;

    this.m12 = this.m21 = ax * axis.y;
    this.m13 = this.m31 = ax * axis.z;
    this.m23 = this.m32 = ay * axis.z;

    this.tx = this.ty = this.tz = 0;
  }

  /**
   * 构造切变矩阵
   *
   * @param axis 1|2|3
   * 1-y += s * x, z += t * x
   * 2-x += s * y, z += s * y
   * 3-x += s * z, y += s * z
   *
   * @param s 控制切变方向和大小
   * @param t
   */
  setupShear(axis: Axis, s: number, t: number) {
    switch (axis) {
      case 1:
        // 用x切变y和z
        this.m11 = 1;
        this.m12 = s;
        this.m13 = t;

        this.m21 = 0;
        this.m22 = 1;
        this.m23 = 0;

        this.m31 = 0;
        this.m32 = 0;
        this.m33 = 1;
        break;
      case 2:
        // 用y切变x和z
        this.m11 = 1;
        this.m12 = 0;
        this.m13 = 0;

        this.m21 = s;
        this.m22 = 1;
        this.m23 = t;

        this.m31 = 0;
        this.m32 = 0;
        this.m33 = 1;
        break;
      case 3:
        // 用z切变y和x
        this.m11 = 1;
        this.m12 = 0;
        this.m13 = 0;

        this.m21 = 0;
        this.m22 = 1;
        this.m23 = 0;

        this.m31 = s;
        this.m32 = t;
        this.m33 = 1;
        break;
    }

    this.tx = this.ty = this.tz = 0;
  }

  /**
   * 构造投影矩阵，投影平面过原点，且垂直于单位向量
   *
   * @param v 单位向量
   */
  setupProject(v: Vector3) {
    if (Math.abs(v.vectorMag() - 1) >= 0.01) {
      throw new Error('单位向量没有标准化');
    }

    this.m11 = 1 - v.x * v.x;
    this.m22 = 1 - v.y * v.y;
    this.m33 = 1 - v.z * v.z;

    this.m12 = this.m21 = -v.x * v.y;
    this.m13 = this.m31 = -v.x * v.z;
    this.m23 = this.m31 = -v.y * v.z;

    this.tx = this.ty = this.tz = 0;
  }

  /**
   * 构造反射矩阵（镜像），反射平面平行于坐标平面
   *
   * @param axis
   * 1-沿x=k平面反射
   * 2-沿y=k平面反射
   * 3-沿z=k平面反射
   * @param k
   */
  setupReflect(axis: Axis | Vector3, k?: number) {
    if (axis instanceof Vector3) {
      // 构造沿任意平面反射的矩阵
      if (Math.abs(axis.vectorMag() - 1) >= 0.01) {
        throw new Error('向量没有标准化');
      }

      const ax = -2 * axis.x;
      const ay = -2 * axis.y;
      const az = -2 * axis.z;

      this.m11 = 1 + ax * axis.x;
      this.m22 = 1 + ay * axis.y;
      this.m33 = 1 + az * axis.z;

      this.m12 = this.m21 = ax * axis.y;
      this.m13 = this.m31 = ax * axis.z;
      this.m23 = this.m32 = ay * axis.z;

      this.tx = this.ty = this.tz = 0;
    } else {
      // 绕x=k、y=k、z=k平面反射
      const defaultK = k ? k : 0;
      switch (axis) {
        case 1:
          this.m11 = -1;
          this.m12 = 0;
          this.m13 = 0;

          this.m21 = 0;
          this.m22 = 1;
          this.m23 = 0;

          this.m31 = 0;
          this.m32 = 0;
          this.m33 = 1;

          this.tx = 2 * defaultK;
          this.ty = 0;
          this.tz = 0;

          break;
        case 2:
          this.m11 = 1;
          this.m12 = 0;
          this.m13 = 0;

          this.m21 = 0;
          this.m22 = -1;
          this.m23 = 0;

          this.m31 = 0;
          this.m32 = 0;
          this.m33 = 1;

          this.tx = 0;
          this.ty = 2 * defaultK;
          this.tz = 0;
          break;
        case 3:
          this.m11 = 1;
          this.m12 = 0;
          this.m13 = 0;

          this.m21 = 0;
          this.m22 = 1;
          this.m23 = 0;

          this.m31 = 0;
          this.m32 = 0;
          this.m33 = -1;

          this.tx = 0;
          this.ty = 0;
          this.tz = 2 * defaultK;
          break;
      }
    }
  }

  multiply(p: Vector3 | Matrix4x3): Vector3 | Matrix4x3 {
    if (p instanceof Vector3) {
      // 变换点
      return new Vector3(
        p.x * this.m11 + p.y * this.m21 + p.z * this.m31 + this.tx,
        p.x * this.m12 + p.y * this.m22 + p.z * this.m32 + this.ty,
        p.x * this.m13 + p.y * this.m23 + p.z * this.m33 + this.tz,
      );
    } else {
      // 连接矩阵
      return new Matrix4x3(
        this.m11 * p.m11 + this.m12 * p.m12 + this.m13 * p.m13,
        this.m11 * p.m12 + this.m12 * p.m22 + this.m13 * p.m32,
        this.m11 * p.m13 + this.m12 * p.m23 + this.m13 * p.m33,

        this.m21 * p.m11 + this.m22 * p.m12 + this.m23 * p.m13,
        this.m21 * p.m12 + this.m22 * p.m22 + this.m23 * p.m32,
        this.m21 * p.m13 + this.m22 * p.m23 + this.m23 * p.m33,

        this.m31 * p.m11 + this.m32 * p.m12 + this.m33 * p.m13,
        this.m31 * p.m12 + this.m32 * p.m22 + this.m33 * p.m32,
        this.m31 * p.m13 + this.m32 * p.m23 + this.m33 * p.m33,

        this.tx * p.m11 + this.ty * p.m21 + this.tz * p.m31 + p.tx,
        this.tx * p.m12 + this.ty * p.m22 + this.tz * p.m32 + p.ty,
        this.tx * p.m13 + this.ty * p.m23 + this.tz * p.m33 + p.tz,
      );
    }
  }

  // 计算3x3部分的行列式值
  determinant(): number {
    return (
      this.m11 * (this.m22 * this.m33 - this.m23 * this.m32) +
      this.m12 * (this.m23 * this.m31 - this.m21 * this.m33) +
      this.m13 * (this.m21 * this.m32 - this.m22 * this.m31)
    );
  }

  /**
   * 计算矩阵的逆
   *
   * 使用伴随矩阵计算
   */
  inverse(): Matrix4x3 {
    const det = this.determinant();

    if (Math.abs(det) < 0.000001) {
      throw new Error('矩阵是奇异的，不可逆');
    }

    const oneOverDet = 1 / det;

    const m11 = (this.m22 * this.m33 - this.m23 * this.m32) * oneOverDet;
    const m12 = (this.m13 * this.m32 - this.m12 * this.m33) * oneOverDet;
    const m13 = (this.m12 * this.m23 - this.m13 * this.m22) * oneOverDet;

    const m21 = (this.m23 * this.m31 - this.m21 * this.m33) * oneOverDet;
    const m22 = (this.m11 * this.m33 - this.m13 * this.m31) * oneOverDet;
    const m23 = (this.m13 * this.m21 - this.m11 * this.m23) * oneOverDet;

    const m31 = (this.m21 * this.m32 - this.m22 * this.m31) * oneOverDet;
    const m32 = (this.m12 * this.m31 - this.m11 * this.m32) * oneOverDet;
    const m33 = (this.m11 * this.m22 - this.m12 * this.m21) * oneOverDet;

    return new Matrix4x3(
      m11,
      m12,
      m13,

      m21,
      m22,
      m23,

      m31,
      m32,
      m33,

      -(this.tx * m11 + this.ty * m21 + this.tz * m31),
      -(this.tx * m12 + this.ty * m22 + this.tz * m32),
      -(this.tx * m13 + this.ty * m23 + this.tz * m33),
    );
  }

  // 提取矩阵的平移部分
  getTranslation(): Vector3 {
    return new Vector3(this.tx, this.ty, this.tz);
  }

  /**
   * 从局部矩阵->父矩阵（如世界->物体），提取物体的位置
   *
   * 矩阵代表刚体变换
   */
  getPositionFromParentToLocalMatrix(): Vector3 {
    // 假设矩阵是正价的，所以该方法并不适用非刚体变换
    return new Vector3(
      -(this.tx * this.m11 + this.ty * this.m12 + this.tz * this.m13),
      -(this.tx * this.m21 + this.ty * this.m22 + this.tz * this.m23),
      -(this.tx * this.m31 + this.ty * this.m32 + this.tz * this.m33),
    );
  }

  /**
   * 从父矩阵->局部矩阵（如物体->世界），提取物体的位置
   */
  getPositionFromLocalToParentMatrix(): Vector3 {
    return new Vector3(this.tx, this.ty, this.tz);
  }
}
