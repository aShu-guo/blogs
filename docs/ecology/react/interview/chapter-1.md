# 1-50

## 何时使用类组件而不是函数组件？

在添加 Hooks（即 React 16.8 及以上版本）后，始终建议在 React 中使用函数组件而不是类组件。因为您也可以在函数组件中使用仅在类组件中可用的状态、生命周期方法和其他功能。

但是，使用 Class 组件而不是 Function 组件仍然有两个理由。

使用函数组件：

- 如果您不需要状态或生命周期方法，并且您的组件纯粹是展示性的。
- 为了简单性、可读性和现代代码实践，特别是使用 React Hooks 来实现状态和副作用。

使用类组件：

- 如果您需要管理状态或使用生命周期方法。
- 在需要向后兼容或与旧代码集成的场景中。

:::info
兼容性、无状态
:::

## 什么是纯组件？

纯组件是指对相同状态和 props 渲染相同输出的组件。在函数组件中，您可以通过`React.memo()`围绕组件的记忆化 API 来实现这些纯组件。此 API 通过使用浅比较来比较先前的 props 和新的 props，从而防止不必要的重新渲染。因此，它将有助于性能优化。

但同时，它不会将之前的状态与当前状态进行比较，因为函数组件本身默认在你再次设置相同状态时防止不必要的渲染。

:::info
联想pure function，相同的输入必定导致相同的输出
:::

## state与props的区别？

- 是否私有：前者私有，后者从父组件传递
- 是否只读：前者可以更改，后者只读（单向的）

## React 中的合成事件是什么?

SyntheticEvent是浏览器原生事件的跨浏览器wrapper。其 API 与浏览器原生事件相同，包括`stopPropagation()`和`preventDefault()`，但事件在所有浏览器上的运作方式相同。可以使用`nativeEvent`属性直接从合成事件访问原生事件。

```jsx
function BookStore() {
  function handleTitleChange(e) {
    // 无参函数的第一个参数是合成事件类型
    console.log("The new title is:", e.target.value);
    // 'e' represents synthetic event
    const nativeEvent = e.nativeEvent;
    console.log(nativeEvent);
    e.stopPropagation();
    e.preventDefault();
  }

  return <input name="title" onChange={handleTitleChange} />;
}
```
