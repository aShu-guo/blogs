# state更新

## react

点击+3按钮产生的效果是+1

```jsx
export default function Counter() {
  const [score, setScore] = useState(0);

  function increment() {
    setScore(score + 1);
  }

  return (<>
    <button onClick={() => increment()}>+1</button>
    <button onClick={() => {
      increment();
      increment();
      increment();
    }}>+3
    </button>
    <h1>Score: {score}</h1>
  </>);
}

```

## vue

点击+3按钮产生的效果是+3

```vue
<template>
  <div class="hello">
    {{ score }}
    <div style="display: flex; justify-content: center">
      <button @click="inc">+1</button>
      <button
        @click="
          () => {
            inc();
            inc();
            inc();
          }
        "
      >
        +3
      </button>
    </div>
  </div>
</template>

<script setup>
  import {ref} from 'vue';

  const score = ref(0);
  const inc = () => {
    score.value++;
  };
</script>
```
