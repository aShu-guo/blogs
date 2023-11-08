# 组合式API

## 概要

介绍组合式API：一系列新增的、基于函数的API，支持可拓展组织结构的组件逻辑

## 基础用例

```vue
<template>
  <button @click="increment">Count is: {{ state.count }}, double is: {{ state.double }}</button>
</template>

<script>
import { reactive, computed } from 'vue';

export default {
  setup() {
    const state = reactive({
      count: 0,
      double: computed(() => state.count * 2),
    });

    function increment() {
      state.count++;
    }

    return {
      state,
      increment,
    };
  },
};
</script>
```

## 动机

### 逻辑复用、代码组织

我们都喜欢Vue的简单易学以及使构建中小项目变得轻而易举。但是随着Vue被广泛使用，许多用户也使用Vue构建大型项目 -
团队多个开发者协同合作，在很长一段时间内迭代、维护的那些。这些年，我们注意到许多基于当前Vue API的项目遇到的编程模型上的局限性。问题可以归纳为两个方面：

1. 随着功能不断新增，复杂组件的代码变得难理解。尤其是当开发者阅读不是自己写的代码时。这个问题的根源是Vue现存API强制基于Options
   API组织代码，但是在一些用例中，按逻辑关注点组织代码更有意义。
2. 对于在多个组件复用和提取逻辑，缺少简洁、成本小的机制。（更多细节在[逻辑提取和代码复用](#逻辑提取和代码复用)）

在这个RFC的提议中，提供用户在组织组件代码时更多的灵活性。在处理每个特定功能时，不再强制基于Options
API组织代码，现在可以基于函数组织代码。提供的APIs在不同组件中，甚至直接在组件外提取和复用逻辑时。我们将会在[详细设计](#详细设计)
章节展示是如何实现的。

### 更好的类型推断

对于大型项目开发者，另一个常见的功能请求是更好的Typescript支持。当与Typescript集成时，现存Vue
API带来了一些挑战，大多数是因为Vue依赖一个单独的`this`上下文来暴露属性，而且Vue组件中的`this`
与纯js使用上不一样（例如：在`methods`中声明的函数中的`this`是指向组件实例的，而不是`methods`
对象）。换句话说，Vue现存API在设计时并没有考虑到类型推断，并且为了在集成Typescript时正常工作，这也造成了很多的复杂性。

使用Vue的用户目前是通过`vue-class-component`集成Typescript，一个允许创建Typescript
class形式组件的库（通过装饰器）。设计3.0时，在[之前的RFC（已经被废弃）](https://github.com/vuejs/rfcs/pull/17)
中，我们试图提供一个内置的Class API来更好的解决类型问题。然而，当我们讨论和迭代这个设计时，我们注意到为了让Class
API解决类型问题，它必须依赖装饰器（这是一个非常不稳定的第 2 阶段W3C提案，其实施细节存在很多不确定性。）这使得在底层使用它是相当冒险的。（关于Class
API类型问题的更多[细节](#类API的类型问题)）

相比之下，本RFC中的API提议大多采用纯变量和函数，这是天然类型友好的。使用提议的API编写代码将会享受完整的类型推断，几乎不需要手动输入类型提示。这也意味着使用提议API的代码，在Typescript和纯js中将会看起来一致，因此即使不使用Typescript的用户也会从类型受益并获得更好的编辑器支持。

## 详细设计

### API介绍

在此处提议的API不是为了引入新概念，而是更多将Vue的核心能力（例如创建和观测响应式状态）独立公开。在这里我们将介绍一系列很基础的API，并且如何使用来替换2.x版本的选项在组件中的逻辑。注意这个章节专注于介绍基本概念，因此并不会详细介绍每个API。详细的API介绍可以参考[API查阅](#API查阅)
章节。

#### 响应式状态和副作用

让我们从一个简单的任务开始：声明一些响应式状态。

```js
import { reactive } from 'vue';

// reactive state
const state = reactive({
  count: 0,
});
```

`reactive`和2.x中的`Vue.observable()`功能相同，更名以避免在使用RxJs时造成困惑。这里，返回的`state`是一个响应式的对象，所有的Vue用户应该很熟悉。

在Vue中，响应式状态是必不可少的用例，我们可以在渲染时使用它。借助于依赖追踪，当响应式状态变化时，视图层将会自动更新。在DOM中渲染一些东西被认为是"
副作用"：我们的程序正在修改程序本身（DOM）外部的状态。基于响应式状态执行和自动重新执行一个副作用，我们可以使用`watchEffect`
API：

```js
import { reactive, watchEffect } from 'vue';

const state = reactive({
  count: 0,
});

watchEffect(() => {
  document.body.innerHTML = `count is ${state.count}`;
});
```

`watchEffect`接收一个函数来执行想要的副作用（在这个用例中，设置`innerHTML`
）。它会立刻执行这个函数，并且跟踪执行过程中所有使用的响应式状态作为依赖。这里，在首次执行之后，`state.count`
将会被作为这个watcher的依赖来追踪。当`state.count`在未来的某个事件改变时，传入的函数将会被再次执行。

这是 Vue 响应式系统的本质。当你在组件中的`data()`返回一个对象时，在内部通过`reactive()`添加响应性。模板被编译进render函数（将其视为一个更高效的
innerHTML），它使用了这些响应式属性。

> `watchEffect`与2.x中的`watch`选项相似，但是它并没有要求将观测数据和回调函数拆分开。组合式API也提供了一个`watch`
> 函数，行为与2.x版本的`watch`选项完全相同。

继续接着上面的例子讲，这是我们如何处理用户的输入：

```js
function increment() {
  state.count++;
}

document.body.addEventListener('click', increment);
```

但是在Vue模板系统中，我们并不需要纠结`innerHTML`或者手动关联事件监听器。使用一个假想的`renderTemplate`
函数简化上述例子，以便我们关注响应副作用：

```js
import { reactive, watchEffect } from 'vue';

const state = reactive({
  count: 0,
});

function increment() {
  state.count++;
}

const renderContext = {
  state,
  increment,
};

watchEffect(() => {
  // hypothetical internal code, NOT actual API
  renderTemplate(`<button @click="increment">{{ state.count }}</button>`, renderContext);
});
```

#### 计算属性和Refs

有时我们需要依赖其他属性的属性（在Vue中它被处理为*计算属性*）。我们可以使用`computed` API直接创建一个计算属性：

```js
import { reactive, computed } from 'vue';

const state = reactive({
  count: 0,
});

const double = computed(() => state.count * 2);
```

`computed`返回的是什么？如果让我们猜测下`computed`内部是怎么实现的，我们可能想到一些如下：

```js
// simplified pseudo code
function computed(getter) {
  let value;
  watchEffect(() => {
    value = getter();
  });
  return value;
}
```

但是我们知道它是无法工作的：如果`value`是一个基本数据类型（像`number`
），一旦它被返回，那么与computed中的更新逻辑之间的将会丢失。这是因为传递js基本数据类型时是值传递，而不是引用传递：

![composition-api-computed.gif](/imgs/vue-rfcs/composition-api-computed.gif)

当值赋值给一个对象作为一个属性时，相同的问题也会发生。当作为一个属性赋值或者从函数中返回，如果不能保留响应性，那么响应式的值并没有多大作用。为了确保我们可以从计算属性中读取到最新的值，我们需要在一个对象中包裹真实的值再返回：

```js
// simplified pseudo code
function computed(getter) {
  const ref = {
    value: null,
  };
  watchEffect(() => {
    ref.value = getter();
  });
  return ref;
}
```

另外，我们需要拦截这个对象的`.value`
属性的读写操作来追踪依赖，并且通知值变更（为简单起见，此处省略代码）。现在我们可以传递计算属性的引用，而无需担心响应性丢失。权衡是为了检索最新的值，我们需要通过`.value`
来访问它：

```js
const double = computed(() => state.count * 2);

watchEffect(() => {
  console.log(double.value);
}); // -> 0

state.count++; // -> 2
```

`double`是一个我们成为"ref"的对象，因为它可以作为持有内部值的响应式引用。

> 你可能已经意识到Vue已经有了"refs"的概念，但是仅对于DOM元素的引用或者模板中的组件实例（"模板refs"）。

除了计算属性，我们也可以使用`ref` API直接创建普通可变引用：

```js
const count = ref(0);
console.log(count.value); // 0

count.value++;
console.log(count.value); // 1
```

#### ref展开

我们可以在渲染上下文中将ref作为属性暴露出去。在内部，Vue将会特殊处理它，以便当在渲染上下文中遇到ref时直接暴露它内部的值。这也意味着，在模板中我们可以直接使用<span v-pre>{{count}}</span>
，而不是<span v-pre>{{count.value}}</span>。

这是相同的计算器示例，使用`ref`而不是`reactive`：

```js
import { ref, watch } from 'vue';

const count = ref(0);

function increment() {
  count.value++;
}

const renderContext = {
  count,
  increment,
};

watchEffect(() => {
  renderTemplate(`<button @click="increment">{{ count }}</button>`, renderContext);
});
```

另外，当ref作为reactive对象的其中的一个属性时，使用时也会自动解构：

```js
const state = reactive({
  count: 0,
  double: computed(() => state.count * 2),
});

// no need to use `state.double.value`
console.log(state.double);
```

#### 在组件中使用

我们的代码到目前为止提供了一个可用的UI，它可以基于用户输入更新DOM（但是这个代码只能运行一次，而且无法复用）。如果我们想要复用这段逻辑，合理的下一步似乎是将它放进函数中：

```js
import { reactive, computed, watchEffect } from 'vue';

function setup() {
  const state = reactive({
    count: 0,
    double: computed(() => state.count * 2),
  });

  function increment() {
    state.count++;
  }

  return {
    state,
    increment,
  };
}

const renderContext = setup();

watchEffect(() => {
  renderTemplate(
    `<button @click="increment">
      Count is: {{ state.count }}, double is: {{ state.double }}
    </button>`,
    renderContext,
  );
});
```

> 注意上面的代码是如何不依赖组件实例的。确实，到目前为止介绍的API都可以在组件上下文外使用，允许我们在广阔的场景中使用Vue的响应式系统。

现在如果我们放弃调用`setup()`，创建watcher和渲染模板到框架中，我们可以仅使用`setup()`函数和模板定义一个组件：

```vue
<template>
  <button @click="increment">Count is: {{ state.count }}, double is: {{ state.double }}</button>
</template>

<script>
import { reactive, computed } from 'vue';

export default {
  setup() {
    const state = reactive({
      count: 0,
      double: computed(() => state.count * 2),
    });

    function increment() {
      state.count++;
    }

    return {
      state,
      increment,
    };
  },
};
</script>
```

这就是我们熟悉的单文件组件形式，仅有的逻辑部分（`<script>`）以不同的格式表达。模板语法保持完全相同。`<style>`
被省略了，但是也完全相同。

#### 生命周期钩子

到目前为止，我们介绍了组件的纯状态概念：响应式状态、计算属性和根据用户输入改变状态。但是一个组件也需要执行副作用（例如：在控制台上打印日志，发送一个ajax请求或者在window上设置一个事件监听器）。这些副作用经常在下面时间点上执行：

- 当一些状态改变时；
- 当组件被挂载时，更新或者卸载时（生命周期钩子）。

我们知道在状态发生改变时，可以使用`watchEffect`和`watch`
APIs来执行副作用。当在不同的生命周期钩子中执行副作用时，我们可以使用专用的`onXXX` APIs（是现存生命周期选项中的镜像）：

```js
import { onMounted } from 'vue';

export default {
  setup() {
    onMounted(() => {
      console.log('component is mounted!');
    });
  },
};
```

这些生命周期函数只能在`setup`执行时使用。它会使用内部全局状态自动检测出被调用`setup`钩子的组件实例。特意以这种设计，来减少逻辑提取到外部函数的性能损耗。

> 关于这些APIs更多的细节可以参考[API查阅](#API查阅)。然而，我们建议在完成下面章节之前再深挖设计细节。

### 代码组织

到此，我们已经复制了带有导入函数的组件API，但是要做什么呢？使用Options API定义组件似乎比在一个大函数中混合所有逻辑更有组织。

这是第一印象的理解。但是正如我们在[动机](#动机)章节提及的那样，我们相信组合式API可以产出更好的有组织的代码，尤其是在复杂组件中。这里我们将会解释为什么。

#### 什么是"有组织的代码"？

让我们后退一步，思考下当讨论"有组织的代码"
时想表达什么。保持代码井井有条的最终目的是让代码足够容易阅读和理解。我们所说的“理解”代码是什么意思？难道因为我们知道了组件包含哪些选项就可以说我们真正理解它了么？你是否运行过一个其他开发者（例如[这个](https://github.com/vuejs/vue-cli/blob/a09407dd5b9f18ace7501ddb603b95e31d6d93c0/packages/@vue/cli-ui/src/components/folder/FolderExplorer.vue#L198-L404)
）写的一个大组件，而且花费大量时间去理解它的情况？

想一想我们将如何引导一位开发人员完成一个像上面链接的大组件。你更可能是从"这个组件是解决问题X、Y和Z的"而不是"
这个组件包含这些data属性、计算属性、方法"。当开始理解组件时，我们更多的关心"这个组件想要做什么"（例如：代码背后的意图）而不是"
组件使用了哪些选项"。使用基于Options API组织代码时可以自然的回答后者，在表达前者时很差。

#### 逻辑关注点 vs 选项

我们定义组件解决"X、Y或Z"问题为**逻辑关注点**
。组件可读性问题并不会在小、单薄组件中出现，因为这整个组件只处理一个单独的逻辑关注点。然而，在高阶用例中会经常出现这个问题。就拿[Vue CLI 文件浏览器](https://github.com/vuejs/vue-cli/blob/a09407dd5b9f18ace7501ddb603b95e31d6d93c0/packages/@vue/cli-ui/src/components/folder/FolderExplorer.vue#L198-L404)
作为例子。这个组件需要处理多个不同的逻辑关注点：

- 跟踪当前目录状态并且展示它的内容
- 处理目录导航（打开、关闭、刷新...）
- 处理新目录创建
- 切换仅展示喜欢的目录
- 切换展示隐藏的目录
- 处理当前工作目录的改变

你可以在阅读了基于Options
API的代码分辨出这些逻辑是哪个关注点的一部分么？这确实有点困难。你会注意到和一个指定逻辑关注点相关的代码经常是片段的而且散落在各个位置。例如，这个"
创建新目录"功能使用了两个data属性、一个计算属性和一个方法（这个方法定义在距离data属性100行之外的地方）。

如果我们颜色标记这些代码关注点，我们注意到当用组件选项表示时它们是多么分散：
![code-scatter.png](/imgs/vue-rfcs/code-scatter.png)

这样的片段确实会使理解和维护一个复杂组件变得困难。通过选项强制分离代码隐藏了潜在的逻辑关注点。另外，当理解一个逻辑关注点时，我们必须不断的在相关选项代码块中不断跳转。

> 注意：原始代码可能有个几个地方可以改进，但是我们在没有修改的情况下展示了最新提交的代码，以提供我们自己编写的实际生产代码示例。

如果我们可以把相同逻辑关注点的代码收集在一起将会很棒。而且这也是确实也是组合式API提供的能力。这个"新建目录"的功能可以通过这种方式实现：

```js
function useCreateFolder(openFolder) {
  // originally data properties
  const showNewFolder = ref(false);
  const newFolderName = ref('');

  // originally computed property
  const newFolderValid = computed(() => isValidMultiName(newFolderName.value));

  // originally a method
  async function createFolder() {
    if (!newFolderValid.value) return;
    const result = await mutate({
      mutation: FOLDER_CREATE,
      variables: {
        name: newFolderName.value,
      },
    });
    openFolder(result.data.folderCreate.path);
    newFolderName.value = '';
    showNewFolder.value = false;
  }

  return {
    showNewFolder,
    newFolderName,
    newFolderValid,
    createFolder,
  };
}
```

注意所有关于新建目录的逻辑是如何收集和封装在单一函数中。由于它具有描述性的名字，看到这个函数就可以知道它是做什么用的。这就是我们称为组合式函数的形式。约定以use开头的函数来标识它是一个组合式函数。这个模式可以在这个组件上所有其他逻辑关注点上使用，来解耦逻辑。

![componsion-api-pattern.png](/imgs/vue-rfcs/componsion-api-pattern.png)

> 此比较不包含导出语句和`setup()`
> 函数。使用组合式API重新实现的组件可以在[此处](https://gist.github.com/yyx990803/8854f8f6a97631576c14b63c8acd8f2e)查看

每个逻辑关注点的代码都通过组合式函数收集在一起。当开发大型组件时，省略了在选项之间来回跳转。组合式函数也可以在IDE中折叠起来以便更容易浏览：

```js
export default {
  setup() {
    // ...
  },
};

function useCurrentFolderData(networkState) {
  // ...
}

function useFolderNavigation({ networkState, currentFolderData }) {
  // ...
}

function useFavoriteFolder(currentFolderData) {
  // ...
}

function useHiddenFolders() {
  // ...
}

function useCreateFolder(openFolder) {
  // ...
}
```

`setup()`函数现在主要用作调用所有组合函数的入口点；

```js
export default {
  setup() {
    // Network
    const { networkState } = useNetworkState();

    // Folder
    const { folders, currentFolderData } = useCurrentFolderData(networkState);
    const folderNavigation = useFolderNavigation({ networkState, currentFolderData });
    const { favoriteFolders, toggleFavorite } = useFavoriteFolders(currentFolderData);
    const { showHiddenFolders } = useHiddenFolders();
    const createFolder = useCreateFolder(folderNavigation.openFolder);

    // Current working directory
    resetCwdOnLeave();
    const { updateOnCwdChanged } = useCwdUtils();

    // Utils
    const { slicePath } = usePathUtils();

    return {
      networkState,
      folders,
      currentFolderData,
      folderNavigation,
      favoriteFolders,
      toggleFavorite,
      showHiddenFolders,
      createFolder,
      updateOnCwdChanged,
      slicePath,
    };
  },
};
```

当然，我们在使用Options API时从来没有写过这样的代码。但是注意setup函数读起来大体描述了组件提供了哪些功能（这在基于option
API中是完全不存在的）。你也可以根据组合函数之间参数的传递清楚的知道它们的依赖关系。最后，返回值单独用于检查暴露给template哪些变量。

给定相同的功能，通过Options API实现的组件和通过组合函数实现的组件是表达相同逻辑的不同实现方式。Options API强制我们基于
*选项类型*组织代码，Composition API使我们基于*逻辑关注点*组织代码。

### 逻辑提取和复用

在组件间使用Composition API提取和复用逻辑是极其灵活的。而不再依赖`this`上下文，组合函数仅依赖它的入参和全局导出的Vue
API。你可以仅简单的将它作为函数导出，复用组件的任何一部分逻辑。你甚至可以通过导出组件整个`setup`函数来实现`extends`相同的功能。

让我们来看一个例子：跟踪鼠标位置。

```js
import { ref, onMounted, onUnmounted } from 'vue';

export function useMousePosition() {
  const x = ref(0);
  const y = ref(0);

  function update(e) {
    x.value = e.pageX;
    y.value = e.pageY;
  }

  onMounted(() => {
    window.addEventListener('mousemove', update);
  });

  onUnmounted(() => {
    window.removeEventListener('mousemove', update);
  });

  return { x, y };
}
```

这是在组件中使用这个函数的方式：

```js
import { useMousePosition } from './mouse';

export default {
  setup() {
    const { x, y } = useMousePosition();
    // other logic...
    return { x, y };
  },
};
```

在基于Composition API的文件浏览器例子中，我们在内部文件中提取了一些工具代码，因为我们发现它们对于其他组件来说也是很有用的。

相同的逻辑复用也可以通过现存的模式例如mixins、高阶组件或者无渲染组件（通过作用域插槽）来实现。在网络上有很多信息来解释这些模式，因此我们不再赘述。相对于组合函数，这些模式每个都有自己的缺点：

- 在渲染上下文中使用的属性来源很模糊。例如，当阅读一个使用了多个mixin的组件中的模板时，很难知道某个属性是从哪个mixin中注入的。
- 命名冲突。Mixins在`data`和`methods`名上发生冲突，而且高阶函数也会在`props`发生冲突。
- 性能。高阶函数和无状态组件中需要额外有状态的组件实例时，会带来额外的性能损耗。

相比之下，使用Composition API：

- 在template中使用的属性有清晰的来源，因为它们是从组合函数中返回的值。
- 从组合函数中返回的值可以是任意值，因此它不会存在命名冲突。
- 没有为逻辑重用而创建不必要的组件实例。

### 和现有API一起使用

Composition API可以与现有Options API一起使用。

- Composition API会在2.x版本的选项（`data`、`computed`、`methods`）之前解析，而且不能调用定义在这些选项中的属性。
- 从`setup()`中返回的属性会暴露在`this`上，而且可以在2.x版本的选项中使用。

### 插件开发

如今，许多Vue插件在`this`中注入了属性。例如Vue Router注入了`this.$route`和`this.$router`，而且Vuex注入了`this.$store`
。这使得类型推断变得麻烦，因为每个插件都需要用户为注入的属性增加 Vue 类型。

当使用Composition API时，没有`this`上下文。取而代之的是，插件将在内部提供provide和inject并暴露出组合函数。以下是插件的假设代码：

```js
const StoreSymbol = Symbol();

export function provideStore(store) {
  provide(StoreSymbol, store);
}

export function useStore() {
  const store = inject(StoreSymbol);
  if (!store) {
    // throw error, no store provided
  }
  return store;
}
```

在使用时：

```js
// provide store at component root
//
const App = {
  setup() {
    provideStore(store);
  },
};

const Child = {
  setup() {
    const store = useStore();
    // use the store
  },
};
```

注意store也可以通过在[全局API变更](./0009-global-api-change.md)的RFC中提议的app级别的provide
API提供，但是在组件消费时，useStore风格API是相同的。

## 缺点

### 引入ref的开销

从技术上讲，Ref是提案中引入的唯一"新"概念。被用来将响应式的值作为变量传递，而不依赖`this`。缺点是：

1. 当使用Composition API时，我们需要不断的区分变量是普通值还是对象，增加了心智负担。

可以通过命名规范或者使用类型系统来大幅减少心智负担（例如：对于ref的变量命名添加`xxxRef`
后缀）。另外一方面，由于在代码组织上灵活性的提高，组件逻辑通常会被隔离成小函数，其中本地上下文很简单并且 refs 的开销很容易管理。

2. 由于需要`.value`，在阅读和改变Ref时代码相对于使用普通值变得很冗余。

一些用户建议使用编译时语法糖来解决上述问题（类似Svelte
3）。这在技术上是可行的，但是我们并不认为这在Vue中默认提供是有意义的（就像在[相较Svelte讨论](#相较Svelte)
中那样）。也就是说，应该在用户侧提供一个babel plugin。

我们也讨论了是否可以仅使用响应式对象来完全避免ref的概念，但是：

- 计算属性的getter会返回基本类型的值，因此一个类似Ref的容器是不可避免的。
- 组合函数接收和返回基本数据类型时，也需要为了响应性在对象中包裹要返回的值。由于我们没有在框架中提供一个标准的Ref实现，用户非常有可能开发自己类似的模式（造成生态割裂）。

### Ref和Reactive

可以理解，用户会困惑于在使用`Ref`和`Reactive`时如何选择。首先要知道的是只有理解两者时，才能充分使用Composition
API。只使用其中一个很可能会导致深奥的解决方法或者重复造轮子。

`ref`和`reactive`的使用可以与你如何在标准js中的编码逻辑相比较：

```js
// style 1: separate variables
let x = 0;
let y = 0;

function updatePosition(e) {
  x = e.pageX;
  y = e.pageY;
}

// --- compared to ---

// style 2: single object
const pos = {
  x: 0,
  y: 0,
};

function updatePosition(e) {
  pos.x = e.pageX;
  pos.y = e.pageY;
}
```

- 如果使用`ref`，我们主要将风格（1）转换为更冗长的等价物（为了保持基本数据类型的响应性）。
- 如果使用`reactive`，那么大致像风格（2）。我们需要通过`reactive`创建对象。

然而，仅使用reactive导致的问题是在调用组合函数时，必须一直持有函数的返回值对象的引用来保持响应性。这个对象不能被解构和传递：

```js
// composition function
function useMousePosition() {
  const pos = reactive({
    x: 0,
    y: 0,
  });

  // ...
  return pos;
}

// consuming component
export default {
  setup() {
    // reactivity lost!
    const { x, y } = useMousePosition();
    return {
      x,
      y,
    };

    // reactivity lost!
    return {
      ...useMousePosition(),
    };

    // this is the only way to retain reactivity.
    // you must return `pos` as-is and reference x and y as `pos.x` and `pos.y`
    // in the template.
    return {
      pos: useMousePosition(),
    };
  },
};
```

`toRefs` API可以解决上述问题（将响应式对象中的每个属性都转换为ref实例）：

```js
function useMousePosition() {
  const pos = reactive({
    x: 0,
    y: 0,
  });

  // ...
  return toRefs(pos);
}

// x & y are now refs!
const { x, y } = useMousePosition();
```

来总结下，这里有两种可行的风格：

1. 使用`ref`和`reactive`就像你在普通js中声明基本数据类型和对象变量时那样。使用这种风格时，建议使用类型系统来获得IDE支持。
2. 尽可能使用`reactive`，但是记得从组合函数中返回响应式对象时使用`toRefs`解构对象。这减少了学习`ref`
   的心智负担，但是并不排除熟悉概念的需要。

在这个阶段，我们认为在`ref`与`reactive`上强制采用最佳实践还为时过早。我们建议您从上述两个选项中选择更符合您风格的一个。我们也会从真实世界收集用户反馈，并且最终在这话题下提供更明确的指导。

### 冗余的返回值

一些用户意识到`setup()`的返回值很冗余而且格式是相同的。

我们认为一个明确的返回值是有利的。它可以让我们更准确的知道哪些属性可以在模板中使用，而且也可以作为一个入口点来跟踪模板使用的属性在组件哪个地方定义的。

有人建议自动暴露在`setup()`中声明的变量，使 return 语句成为可选的。同样，我们认为这不应该是默认的策略，因为它会违背标准
JavaScript的直觉。然而，有一些方法可以让它在用户侧中变得不那么繁琐：

- 通过IDE插件支持，根据`setup()`中定义的变量自动生成return语句
- 通过Babel插件隐式生成并插入返回语句。

### 更多的灵活性需要更多的规范

许多用户指出虽然Composition API在组织代码上提供了更多的灵活性，但是也要求更多的规范要引导开发者正确使用。一些用户担心这种API形式会导致新手写出意大利面条那样的代码。换句话说，虽然Composition
API提高了代码质量的上线，但是也降低了下限。

我们在一定程度上同意这个观点。但是，我们相信：

1. 上限提升获得受益高于下限降低的损失。
2. 通过文档和社区的引导，我们可以有效的解决代码组织的问题。

一些用户使用 Angular 1 Controller作为设计如何导致代码编写不佳的示例。 Composition API 和 Angular 1
Controller之间的最大区别在于它不依赖于共享上下文作用域。这使得将逻辑拆分为单独的函数变得非常容易，这是 JavaScript
代码组织的核心机制。

任何JavaScript程序都开始于一个入口文件（将其视为程序的`setup()`）。我们基于逻辑关注点拆分代码到多个函数和模块中来组织程序。\*
\*Composition API提供给我们以这种方式来实现Vue组件\*\*。换句话说，写出组织良好的JavaScript代码的技巧同样适用于使用Composition
API精心良好的Vue代码。

## 采取的策略

Composition API完全是新增的，而且不会影响或者废弃现存的2.x版本的API。而且可以在2.x版本通过`@vue/composition`
库作为插件使用。这个库最初的目的是提供Composition
API的测试版，来收集用户反馈的。当前库的实现与此提案保持同步，但由于作为插件的技术限制，可能包含轻微的不一致。随着提案的更新，库也会有重大变更，所以在当前阶段并不建议在生产环境使用。

我们计划在3.0版本发布它，而且可以于2.x版本的Options API一同使用。

对于那些在项目中只使用Composition API的用户，我们可能提供一个编译时的标识来丢弃2.x版本中Options
API相关的代码来减少库的大小。但是，这完全是可选的。

Composition API将定位为高级功能，因为它旨在解决的问题主要出现在大型应用程序中。我们不打算彻底修改文档来它作为默认使用。相反，它将在文档中有自己的专用部分。

## 附录

### 类API的类型问题

引入Class API作为一个可选API的初衷是提供更好的Typescript支持。但是事实上，Vue组件需要将多个属性来源合并到单个`this`
上下文中，即便是Class API也是如此，这产生了一些挑战。

一个例子是props的类型。为了合并props到`this`中，我们需要在类组件中使用一个泛型参数或者使用一个装饰器。

这是一个使用泛型参数的例子：

```typescript
interface Props {
  message: string;
}

class App extends Component<Props> {
  static props = {
    message: String,
  };
}
```

因为传递给泛型参数的`interface`仅在类型域中，因此用户仍需要为props代理行为添加运行时props声明。这种双重声明是多余而且笨拙的。

我们考虑将装饰器作为另外一种可选的方式：

```js
class App extends Component<Props> {
    @prop message: string
}
```

使用装饰器会依赖不确定的2阶段提案，尤其是Typescript当前的实现已经与TC39的提案不同步了。但是这种方式无法暴露出在this.$props上的类型声明，这会破坏TSX的支持。用户还可能假设他们可以使用`@props message: string = 'foo'`
为prop声明一个默认值，但是从技术上讲它不能按着预期工作。

此外，目前还没有方法在类方法的参数中使用上下文类型化 -- 这意味着传递给`render`函数的参数并不具备推断其他类属性类型的能力。

### 相较React Hook

Composition API提供了跟React Hook相同的逻辑组合能力，但是也有一些不同。不像React Hooks，`setup()`只会执行一次。这意味着使用Composition
API写出的代码：

- 通常更符合惯用JavaScript代码的直觉；
- 对调用顺序是不敏感的，而且根据条件调用；
- 在每次渲染时不会重新执行，而且只会产生很小的GC压力；
- 不会出现使用`useCallback`阻止行内`handler`执行造成子组件过多重复渲染的问题；
- 不会出现使用`useEffect`和`useMemo`时，用户忘记传入正确的参数依赖而捕获旧值的问题。Vue自动依赖追踪保证`watcher`
  和`computed`的值总是正确的失效。

我们承认React Hook的创造性，而且这个提案的大部分是受它的启发。但是，在它的设计中存在上面提到的问题，而且我们意识到Vue响应式模型可以解决上述问题。

### 相较Svelte

尽管走的是两条路线，但是Composition API和Svelte基于编译的途径确实存在很多相同的概念。

#### Vue

```vue
<script>
import { ref, watchEffect, onMounted } from 'vue';

export default {
  setup() {
    const count = ref(0);

    function increment() {
      count.value++;
    }

    watchEffect(() => console.log(count.value));

    onMounted(() => console.log('mounted!'));

    return {
      count,
      increment,
    };
  },
};
</script>
```

#### Svelte

```vue
<script>
import { onMount } from 'svelte';

let count = 0;

function increment() {
  count++;
}

$: console.log(count);

onMount(() => console.log('mounted!'));
</script>
```

Svelte的代码看起来更简洁，使用它在编译时做了下面这些事情：

- 隐式的用一个函数将`script`的代码包裹（导入语句除外），并且放在每个组件实例调用的函数中（而不是仅执行一次）
- 为变量隐式的添加响应性
- 隐式的暴露所有作用域中的属性到渲染上下文中
- 将`$`编译为重复执行的代码

从技术上来说，我们也可以在Vue中实现（可能是通过用户侧的Babel插件）。没有这样做的最重要的原因是我们要
**跟标准Javascript保持一致**。如果用户从Vue文件中提取出`script`
中的代码时，我们需要让它像标准ES模块那样工作。另一方面，从技术上来说Svelte`<script>`中代码并不是标准的Javascript。通过编译时途径实现存在一些问题：

1. 在有无编译时代码运行不一样。作为一个渐进式框架，许多Vue用户可能希望/需要/必须使用非编译时版本，所以运行时版本并不能作为默认选项。
   另一方面，Svelte将自身作为一个编译时并且只能在构建之后运行。这是两个框架都在有意识地做出的权衡。

2. 代码在组件外和组件内运行不一样。当抽取Svelte组件的js逻辑到单独的Javascript文件中时，代码将会将变得冗余而且不得不使用低级的、冗余的API。
3. Svelte的响应式编译只会作用于最高层的变量（并不会作用于在函数中声明的变量），
   因此我们[不能将可变的状态封装到组件内声明的函数中](https://svelte.dev/repl/4b000d682c0548e79697ddffaeb757a3?version=3.6.2)
   。这对内部需要函数的代码组织添加了重要限制（就像我们在RFC中建议的那样），这对保证大型组件可维护性是很重要的方式。
4. 非标准语义使得与 TypeScript 的集成存在问题。

当然这不是说Svelte是个坏主意 - 事实上，这是一个非常具有创新性的方式，而且我们高度尊重Rich的贡献。但是基于Vue的设计约束和目标，我们不得不做出不同的权衡。
