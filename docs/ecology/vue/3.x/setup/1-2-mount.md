# mount()  render()
##
`app.mount()`  DOM  DOM
---
##  mount()
```mermaid
graph TD
    A["app.mount(container)"] -->|| B{?}
    B -->|| C[" "]
    B -->|| D[" VNode"]
    D -->|| E["AppContext"]
    E -->|| F["render(vnode, container)"]
    F -->|| G["patch(null, vnode, container)"]
    G -->|| H["processComponent"]
    H -->|| I["mountComponent"]
    I -->|| J["setupComponent"]
    J -->|| K["setup()"]
    K -->|| L["setupRenderEffect"]
    L -->|| M["patch(subTree)"]
    M -->|| N[""]
    N -->| | O[""]
```
---
##  mount()
###  1
```typescript
mount(
  rootContainer: HostElement | string,
  isHydrate?: boolean,
  namespace?: boolean | ElementNamespace,
): ComponentPublicInstance {
  //
  if (!isMounted) {
    // ...
  } else if (__DEV__) {
    warn(
      `App has already been mounted.\n` +
      `If you want to remount the same app, move your app creation logic ` +
      `into a factory function and create fresh app instances for each mount.`
    )
  }
}
```
****
-
-
-
###  2  VNode
```typescript
const vnode = app._ceVNode || createVNode(rootComponent, rootProps)
// createVNode
interface VNode {
  type: typeof rootComponent,  //
  props: rootProps,            //  props
  children: undefined,
  el: null,
  component: null,
  // ...
}
```
**`app._ceVNode` **
- Custom Elements
-
###  3
```typescript
vnode.appContext = context
//
// 1.
// 2.
// 3.  provide/inject
```
###  4  namespace
```typescript
if (namespace === true) {
  namespace = 'svg'
} else if (namespace === false) {
  namespace = undefined
}
//
// - namespace = 'svg':  SVG
// - namespace = 'mathml':  MathML
// - namespace = undefined:  HTML
```
###  5  render()
```typescript
//
if (isHydrate && hydrate) {
  // SSR  HTML
  hydrate(vnode as VNode<Node, Element>, rootContainer as any)
} else {
  //
  render(vnode, rootContainer, namespace)
}
```
**(Hydration) vs (Render)**
|  |  |  |
|------|------|------|
| Hydration | SSR |  HTML |
| Render | CSR |  DOM |
###  6
```typescript
isMounted = true
app._container = rootContainer
;(rootContainer as any).__vue_app__ = app  //
```
****
-
-  devtools  Vue
###  7
```typescript
if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
  app._instance = vnode.component
  devtoolsInitApp(app, version)
}
```
###  8
```typescript
return getComponentPublicInstance(vnode.component!)
```
---
##  render()
### render()
```mermaid
graph LR
    A["render(vnode, container)"] -->|| B["patch()"]
    B -->| DOM| C[""]
    C -->|ELEMENT| D["processElement"]
    C -->|COMPONENT| E["processComponent"]
    C -->|TEXT| F["processText"]
    C -->|FRAGMENT| G["processFragment"]
```
### render()
```typescript
const render: RootRenderFunction = (vnode, container, namespace) => {
  if (vnode == null) {
    // vnode  null
    if (container._vnode) {
      unmount(container._vnode, null, null, true)
    }
  } else {
    //  patch
    patch(
      container._vnode || null,
      vnode,
      container,
      null,
      null,
      null,
      namespace,
    )
  }
  //  vnode
  container._vnode = vnode
  //
  flushPostFlushCbs()
}
```
****
1. `container._vnode`:  VNode
2.  `patch()`
3. `flushPostFlushCbs()`:  mountedupdated
---
##  patch()
### patch()
```typescript
const patch = (
  n1: VNode | null,        //  VNode
  n2: VNode,               //  VNode
  container: Container,
  anchor: any = null,
  parentComponent: any = null,
  parentSuspense: any = null,
  namespace: string | null = null,
): void => {
  //
  if (n1 === n2) return
  //
  if (n1 && !isSameVNodeType(n1, n2)) {
    anchor = getNextHostNode(n1)
    unmount(n1, parentComponent, parentSuspense, true)
    n1 = null
  }
  //  VNode
  const { type, shapeFlag } = n2
  if (type === Text) {
    //
    processText(n1, n2, container, anchor)
  } else if (type === Fragment) {
    //  Fragment
    processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, namespace)
  } else if (shapeFlag & ShapeFlags.ELEMENT) {
    //  HTML
    processElement(n1, n2, container, anchor, parentComponent, parentSuspense, namespace)
  } else if (shapeFlag & ShapeFlags.COMPONENT) {
    //
    processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, namespace)
  } else if (shapeFlag & ShapeFlags.TELEPORT) {
    //  Teleport
    ;(type as typeof TeleportImpl).process(...)
  } else if (shapeFlag & ShapeFlags.SUSPENSE) {
    //  Suspense
    ;(type as typeof SuspenseImpl).process(...)
  }
}
```
### ShapeFlags
```typescript
const ShapeFlags = {
  ELEMENT: 1,                    // 1 (001)
  FUNCTIONAL_COMPONENT: 1 << 1,  // 2 (010)
  STATEFUL_COMPONENT: 1 << 2,    // 4 (100)
  // ...
}
//
if (shapeFlag & ShapeFlags.COMPONENT) {
  //  ( 1  2 )
}
if (shapeFlag & ShapeFlags.ELEMENT) {
  //  HTML
}
```
---
##  processComponent()
### processComponent()
```typescript
const processComponent = (
  n1: VNode | null,        //  VNode null
  n2: VNode,               //  VNode
  container: Container,
  anchor: any = null,
  parentComponent: any = null,
  parentSuspense: any = null,
  namespace: string | null = null,
  optimized: boolean = false,
) => {
  n2.slotScopeIds = slotScopeIds
  if (n1 == null) {
    //
    if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
      // KeepAlive
      ;(parentComponent!.ctx as KeepAliveContext).activate(...)
    } else {
      //
      mountComponent(n2, container, anchor, parentComponent, parentSuspense, namespace, optimized)
    }
  } else {
    //
    updateComponent(n1, n2, optimized)
  }
}
```
---
##
```mermaid
graph TD
    subgraph
    A["app.mount()"]
    B["render(vnode)"]
    C["patch(null, vnode)"]
    D["processComponent()"]
    end
    subgraph
    E["mountComponent()"]
    F["createComponentInstance()"]
    G["setupComponent()"]
    H["setupStatefulComponent()"]
    I["setup()"]
    end
    subgraph
    J["setupRenderEffect()"]
    K["ReactiveEffect"]
    L["renderComponentRoot()"]
    M["patch(subTree)"]
    end
    A -->|| B
    B -->|| C
    C -->|| D
    D -->|| E
    E -->|| F
    F -->|| G
    G -->|| H
    H -->|| I
    I -->|| J
    J -->|| K
    K -->|| L
    L -->|| M
```
---
##
### 1.
```typescript
//
if (n1 === n2) return
```
### 2.
```typescript
//  ShapeFlags
if (shapeFlag & ShapeFlags.COMPONENT) {
  //  typeof  instanceof
}
```
### 3. namespace
```typescript
//  namespace
namespace: ElementNamespace | null = null
```
---
##
###  1:
```typescript
const app = createApp(App)
app.mount('#app')
//
// app.mount('#app')
//   → render(vnode, container)
//     → patch(null, vnode, container)
//       → processComponent(null, vnode, ...)
//         → mountComponent()
```
###  2:
```typescript
app.mount('#app')
app.mount('#app')  //
//
function createMyApp() {
  return createApp(App)
}
const app1 = createMyApp()
app1.mount('#app1')
const app2 = createMyApp()
app2.mount('#app2')
```
###  3: SSR
```typescript
const app = createApp(App)
app.mount('#app', true)  // isHydrate = true
//
// app.mount('#app', true)
//   → hydrate(vnode, container)
//     →  HTML
//     →
```
---
##
- [](./1-3-component-init.md) -  mountComponent()
- [setup ](./1-4-setup.md) -  setup()
- [](./1-5-render-effect.md) -  setupRenderEffect()
- [createApp() ](./1-2-createapp.md) -
- [](./1-1-overview.md) -
