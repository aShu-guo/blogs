export class Vector3 {
  x: number;
  y: number;
  z: number;

  // 最好不要做缺省处理，如果偏好缺省处理，最好是初始化为零向量
  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // 比较两向量是否相同
  isEqual(vector: Vector3): boolean {
    return vector.x === this.x && vector.y === this.y && vector.z === this.z;
  }

  // 将向量置为零向量
  zero() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }

  // 向量加法
  plus(vector: Vector3): Vector3 {
    return new Vector3(this.x + vector.x, this.y + vector.y, this.z + vector.z);
  }

  // 向量减法
  subtract(vector: Vector3): Vector3 {
    return new Vector3(this.x - vector.x, this.y - vector.y, this.z - vector.z);
  }

  // 向量与标量的乘积 和 点乘（向量与向量的乘积）
  multiply(factor: number | Vector3): number | Vector3 {
    if (factor instanceof Vector3) {
      // 向量点乘
      return this.x * factor.x + this.y * factor.y + this.z * factor.z;
    } else {
      // 向量与标量相乘
      return new Vector3(factor * this.x, factor * this.y, factor * this.z);
    }
  }

  // 向量与标量的除法
  division(factor: number): Vector3 {
    return new Vector3(this.x / factor, this.y / factor, this.z / factor);
  }

  // 取向量的模
  vectorMag(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
  }

  // 向量标准化
  normalize(): Vector3 {
    const length = this.vectorMag();
    return new Vector3(this.x / length, this.y / length, this.z / length);
  }
}

export class Vector3Helper {
  private constructor() {}

  // 两向量的叉乘
  static crossProduct(vector: Vector3, vector1: Vector3): Vector3 {
    return new Vector3(
      vector.y * vector1.z - vector.z * vector1.y,
      vector.z * vector1.x - vector.x * vector1.z,
      vector.x * vector1.y - vector.y * vector1.x,
    );
  }

  // 两向量之间的距离
  static distance(vector: Vector3, vector1: Vector3): number {
    return vector.subtract(vector1).vectorMag();
  }
}
