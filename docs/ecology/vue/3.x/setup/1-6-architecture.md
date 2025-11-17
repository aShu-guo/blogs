#
##
 Vue 3
---
##
### 1. ShapeFlags - VNode
```typescript
//  VNode
const ShapeFlags = {
  //
  ELEMENT: 1,                         // 001
  FUNCTIONAL_COMPONENT: 1 << 1,       // 010
  STATEFUL_COMPONENT: 1 << 2,         // 100
  //
  TEXT_CHILDREN: 1 << 3,              // 1000
  ARRAY_CHILDREN: 1 << 4,             // 10000
  SLOTS_CHILDREN: 1 << 5,             // 100000
  //
  TELEPORT: 1 << 6,                   // 1000000
  SUSPENSE: 1 << 7,                   // 10000000
  COMPONENT_SHOULD_KEEP_ALIVE: 1 << 8,
  COMPONENT_KEPT_ALIVE: 1 << 9,
}
//
if (vnode.shapeFlag & ShapeFlags.COMPONENT) {
  // FUNCTIONAL_COMPONENT  STATEFUL_COMPONENT
}
```
****
```mermaid
graph TD
    A[" VNode "] -->|1| B["instanceof"]
    A -->|2| C["typeof"]
    A -->|3| D[""]
    B -->|| E[""]
    C -->|| F[""]
    D -->|| G[""]
    G -->|O1 | H[" CPU "]
```
### 2. PatchFlags -
```typescript
const PatchFlags = {
  TEXT: 1,                    //
  CLASS: 1 << 1,              // class
  STYLE: 1 << 2,              // style
  PROPS: 1 << 3,              // props
  FULL_PROPS: 1 << 4,         //  props
  HYDRATE_EVENTS: 1 << 5,     // SSR
  STABLE_FRAGMENT: 1 << 6,    // Fragment  key
  KEYED_FRAGMENT: 1 << 7,     // Fragment  key
  UNKEYED_FRAGMENT: 1 << 8,   // Fragment  key
  NEED_PATCH: 1 << 9,         //  patch
  DYNAMIC_SLOTS: 1 << 10,     //
}
```
****
```vue
<!--  -->
<div :id="id" class="static">{{ message }}</div>
<!--  -->
_createVNode('div',
  { id: id, class: 'static' },
  message,
  PatchFlags.TEXT  // ←
)
<!--  -->
patch() {
  //  TEXT
  //  class  id
}
```
---
##
### 1. WeakMap
```typescript
//  AppContext
optionsCache: new WeakMap()     //
propsCache: new WeakMap()       // props
emitsCache: new WeakMap()       // emits
//
// 1.
// 2.
// 3. O(1)
// 4.
```
****
```mermaid
graph TD
    A[" A "] -->|| B["WeakMap<Component, Options>"]
    C[" B "] -->|,| D[""]
    D -->|| E[""]
    F[" A "] -->|GC| G[""]
    G -->|| H[""]
```
### 2. accessCache -
```typescript
//  ComponentInternalInstance
accessCache: Record<string, number | undefined> = Object.create(null)
//
//  0:  setupState
//  1:  props
//  2:  data
// ...
//  this.count
// count  setupState
accessCache['count'] = 0
//  this.count
//  setupState[0]
```
****
```mermaid
graph TD
    A["1: this.count"] -->|Proxy handler| B[""]
    B -->|| C["setupState"]
    C -->|| D[""]
    D -->|| E["value"]
    F["2: this.count"] -->|accessCache| G[""]
    G -->| handler| H[" value"]
    Note1[" -  Proxy handler"]
    Note2[" -  -  10+"]
    E --> Note1
    H --> Note2
```
### 3. /
```typescript
// setupStatefulComponent
pauseTracking()      // ← setup
// setup()
// count.value
//
resetTracking()      // ←
// render()
// count.value
//
```
****
```mermaid
graph TD
    A["setup "] -->|| B[""]
    C["render "] -->|| D[" render "]
    Note["setup "]
    Note2["render "]
```
### 4.
```typescript
//
const queue: SchedulerJob[] = []
//
count.value++      // → queueJob(update)
message.value = '' // → queueJob(update)  //
flag.value = true  // → queueJob(update)  //
// update
//
// flushJobs() →  update
```
****
```
  count.value++     → update() → render
  message.value = '' → update() → render    (3  render)
  flag.value = true → update() → render
  count.value++
  message.value = ''
  flag.value = true
  → update() → render                       (1  render)
```
### 5. Fragment
```typescript
//
export default {
  template: `
    <div>1</div>
    <div>2</div>
    <div>3</div>
  `
}
//  Fragment
_createVNode(Fragment, null, [
  _createVNode('div', null, '1'),
  _createVNode('div', null, '2'),
  _createVNode('div', null, '3'),
])
//
// -
// -
```
### 6. PatchFlags
```typescript
//  diff
//  diff PatchFlags
//
const vnode = {
  props: { id, class: 'static' },
  children: message,
  patchFlag: TEXT  //  TEXT
}
//
if (patchFlag & TEXT) {
  //
  updateText()
}
// class  id
```
---
##
###
```typescript
// Vue 2
setup()
  ↓ handleSetupResult()
    ↓ finishComponentSetup()
      ↓ applyOptions()
        ↓ processLifecycleHook()
// Vue 3
setup()              // ←
renderComponentRoot()  // ←
```
###
```typescript
// Vue
const compileCache: Record<string, RenderFunction> = Object.create(null)
function compileToFunction(template: string) {
  const key = genCacheKey(template, options)
  //
  if (key in compileCache) {
    return compileCache[key]
  }
  //
  const { code } = compile(template, options)
  const render = new Function('Vue', code)(runtimeDom)
  return compileCache[key] = render
}
```
---
##
###
```mermaid
graph TD
    A[""] -->|| B["ComponentInternalInstance"]
    B -->|| C["~5KB"]
    D["1000 "] -->|| E["5MB"]
    F[" WeakMap"] -->|| G[""]
    G -->|| H[""]
    vs["vs"]
    I[" WeakMap"] -->|| J[""]
    J -->|| K["1000"]
    K -->|| L["5MB "]
    E --> vs
    L
```
###
```typescript
//
if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
  devtoolsComponentAdded(instance)
}
//
initialVNode = container = anchor = null as any
// ↑
```
---
##
###
```vue
<!--  -->
<div>
  <span class="static">{{ message }}</span>
  <span class="static">{{ count }}</span>
</div>
<!--  -->
_createVNode('div', null, [
  _createVNode('span', { class: 'static' }, message),
  _createVNode('span', { class: 'static' }, count),
])
<!--  -->
const staticSpan = _createVNode('span', { class: 'static' })
_createVNode('div', null, [
  _cloneVNode(staticSpan, { children: message }),
  _cloneVNode(staticSpan, { children: count }),
])
```
###
```vue
<!--  -->
<div class="item">
  <div class="text">{{ name }}</div>
  <div class="desc">{{ desc }}</div>
</div>
<!--  -->
const _hoisted_1 = _createStaticVNode(
  '<div class="item"><div class="text"></div><div class="desc"></div></div>',
  1
)
// render
```
---
##
###
|  |  |  |  |
|------|-------|-------|------|
|  | 100ms | 30ms | 3.3x |
|  | 50MB | 15MB | 3.3x |
|  render | 50ms | 10ms | 5x |
|  | 1μs | 0.1μs | 10x |
###
```typescript
// Vue
app.config.performance = true
//  Performance API
// 1. 'vue init' -
// 2. 'vue setup' - setup
// 3. 'vue render' - render
// 4. 'vue patch' - patch
// 5. 'vue update' -
```
---
##
```mermaid
graph TD
    A[""] -->|PatchFlags| B[""]
    B -->|| C[" diff"]
    D[""] -->|accessCache| E[""]
    E -->|| F[" render"]
    G[""] -->|| H[""]
    H -->| render| I[""]
    J[""] -->|WeakMap| K[""]
    K -->|| L[""]
    C -->|M| N[""]
    F -->|M| N
    I -->|M| N
    L -->|M| N
```
---
##
- [](./1-5-render-effect.md) -
- [](./1-3-component-init.md) -  accessCache
- [mount  render](./1-2-mount.md) -  patch
- [](./1-1-overview.md) -
---
##
### 1.  computed
```typescript
//   render
setup() {
  return {
    doubledList: items.value.map(x => x * 2)
  }
}
//
setup() {
  return {
    doubledList: computed(() => items.value.map(x => x * 2))
  }
}
```
### 2.  setup
```typescript
//   render
setup() {
  const style = { color: color.value }
  return { style }
}
//   computed
setup() {
  const style = computed(() => ({ color: color.value }))
  return { style }
}
```
### 3.  ref vs reactive
```typescript
//   ref
const a = ref(0)
const b = ref(1)
const c = ref(2)
//   reactive
const state = reactive({ a: 0, b: 1, c: 2 })
```
---
##
- Vue 3 https://github.com/vuejs/core
- https://vuejs.org/guide/best-practices/performance.html
- https://github.com/vuejs/core/tree/main/packages/compiler-core
