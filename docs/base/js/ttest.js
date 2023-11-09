const Device = function (model, weight, battery) {
    this.model = model
    this.weight = weight
    this.battery = battery
    this.introduce = function () {
        console.log(`[{model: ${this.model}, weight: ${this.weight}, battery: ${this.battery}]`)
    }

    this.modifyModel = function (model) {
        console.log('>>>>>>this.model:', this.model)
        this.model = model
    }
}

const Airport = function (position, model, weight, battery,) {
    Device.call(this, model, weight, battery)
    // 机场位置
    this.position = position
    this.fly = function () {
        console.log('机场')
    }
    this.sendSignal = function (uav) {
        console.log('向无人机:' + uav + '发送信号')
    }
}

Airport.prototype = Object.create(Device.prototype)
Airport.prototype.constructor = Airport
const airport1 = new Airport([11, 11], '123123123')
// airport1.modifyModel('111')
// airport1.model = '123123123'
console.log(airport1.model)
const airport2 = new Airport([22, 22], 'aaaaa')
// airport2.modifyModel('aaaaaa')
console.log(airport2.model)
// airport1.model = 'aaaaa'









