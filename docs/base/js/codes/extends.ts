const Device = function (model, weight, battery) {
  // 型号
  this.model = model;
  // 重量
  this.weight = weight;
  // 电池容量
  this.battery = battery;
  this.introduce = function () {
    console.log(
      `[{model: ${this.model}, weight: ${this.weight}, battery: ${this.battery}]`,
    );
  };

  this.modifyModel = function (model) {
    this.model = model;
    this.introduce();
  };
};

const Airport = function (position, model, weight, battery) {
  Device.call(this, model, weight, battery);
  // 机场位置
  this.position = position;
  this.fly = function () {
    console.log('机场');
  };
  this.sendSignal = function (uav) {
    console.log('向无人机:' + uav + '发送信号');
  };
};

Airport.prototype = new Device('DJIxxxx-xxxx', '98kg', '60%');
Airport.prototype.constructor = Airport;
