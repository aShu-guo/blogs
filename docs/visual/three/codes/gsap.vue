<template>
  <div style="width: 100%; background: white; color: black; padding: 20px">
    <div
      id="gsap-radio-box"
      style="
        display: flex;
        justify-content: space-between;
        width: 70%;
        margin: 0 auto;
      "
      @click="changeHandler"
    >
      <div>
        <input type="radio" id="to" name="type" value="to" checked />
        <label for="to">to</label>
      </div>
      <div>
        <input type="radio" id="from" name="type" value="from" />
        <label for="from">from</label>
      </div>
      <div>
        <input type="radio" id="fromTo" name="type" value="fromTo" />
        <label for="fromTo">fromTo</label>
      </div>
      <div>
        <input type="radio" id="set" name="type" value="set" />
        <label for="set">set</label>
      </div>
    </div>
    <div style="display: flex; margin-top: 20px; justify-content: center">
      <div
        style="
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: dashed 1px;
        "
      ></div>
      <div
        id="geometry"
        style="
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: red;
          margin: 0 100px;
        "
      ></div>
      <div
        style="
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: dashed 1px;
        "
      ></div>
    </div>
    <div
      v-if="code"
      style="display: flex; justify-content: center; margin-top: 20px"
    >
      <code>{{ code }}</code>
    </div>
  </div>
</template>

<script setup>
import gsap from 'gsap';
import { ref } from 'vue';

defineOptions({ name: 'gasp' });

const code = ref('');

const changeHandler = (e) => {
  const { value, checked } = e.target;

  switch (value) {
    case 'to':
      gsap.fromTo(
        '#geometry',
        { x: 0 },
        {
          x: 200,
          duration: 3,
        },
      );
      code.value = "gsap.to('#geometry', { x: 200, duration: 3 })";
      break;
    case 'from':
      gsap.fromTo(
        '#geometry',
        { x: -200 },
        {
          x: 0,
          duration: 3,
        },
      );
      code.value = "gsap.from('#geometry', { x: -200, duration: 3 })";
      break;
    case 'fromTo':
      gsap.fromTo(
        '#geometry',
        { x: -200 },
        {
          x: 200,
          duration: 3,
        },
      );
      code.value =
        "gsap.fromTo('#geometry', { x: -200 }, { x: 200, duration: 3 })";
      break;
    case 'set':
      gsap.fromTo(
        '#geometry',
        { x: 0 },
        {
          x: 200,
          duration: 0,
        },
      );
      code.value = "gsap.set('#geometry', { x: 200 })";
      break;
  }
};
</script>
