import { kPi, kPiOver2, wrapPi } from './MathUtil';

export class EulerAngles {
  heading: number;
  pitch: number;
  bank: number;

  constructor(heading: number, pitch: number, bank: number) {
    this.heading = heading;
    this.pitch = pitch;
    this.bank = bank;
  }

  //   置零
  identity() {
    this.heading = this.pitch = this.bank = 0;
  }

  //   变为“限制集”欧拉角，角度约定在规定范围内
  canonize() {
    this.pitch = wrapPi(this.pitch);

    // 将pitch 变换到-pi/2到pi/2之间
    if (this.pitch < -kPiOver2) {
      this.pitch = -kPi - this.pitch;
      this.heading += kPi;
      this.bank += kPi;
    } else if (this.pitch > kPiOver2) {
      this.pitch = kPi - this.pitch;
      this.heading += kPi;
      this.bank += kPi;
    }

    //   现在检查万向锁，并且允许存在一定的误差
    if (Math.abs(this.pitch) > kPiOver2 - 1e-4) {
      // 万向锁，将所有绕垂直轴的旋转赋给heading
      this.heading += this.bank;
      this.bank = 0;
    } else {
      // 非万向锁，将bank转换到限制集中
      this.bank = wrapPi(this.bank);
    }

    // 将heading转换到限制集中
    this.heading = wrapPi(this.heading);
  }

  //   四元数、欧拉角之间转换
  //   输入的四元数假设为物体-惯性或惯性-物体四元数
  fromObjectToInertialQuaternion(q: Quaternion) {}

  fromInertialQuaternionToObject(q: Quaternion) {}

  //   矩阵、欧拉角之间转换
  //   输入的矩阵假设为物体-世界或世界-物体转换矩阵
  //   平移部分被省略，并且假设矩阵是正交的
  fromObjectToWorldMatrix(m: Matrix4x3) {}

  fromWorldToObjectMatrix(m: Matrix4x3) {}

  //    从旋转矩阵转换到欧拉角
  fromRotationMatrix(m: RotationMatrix) {}
}

// 全局"单位"欧拉角
export const kRulerAnglesIdentity: EulerAngles = new EulerAngles(0, 0, 0);
