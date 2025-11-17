# setupRenderEffect()
##
`setupRenderEffect()` " → "
---
##
```mermaid
graph TD
    A["setupRenderEffect()"] -->|| B["ReactiveEffect"]
    B -->|| C["componentUpdateFn"]
    C -->|| D["effect.run()"]
    D -->|| E["renderComponentRoot()"]
    E -->| render| F[""]
    F -->| getter| G["track()"]
    G -->|| H["targetMap"]
    H -->|| I[" ↔ effect"]
    I -->|| J[" setter"]
    J -->| trigger| K[" effect"]
    K -->|| L[""]
    L -->|| M["instance.update()"]
    M -->|| N["componentUpdateFn"]
    N -->| render| O[" DOM"]
    O -->|patch| P[" DOM"]
```
---
##  setupRenderEffect()
###
```typescript
const setupRenderEffect: SetupRenderEffectFn = (
  instance,
  initialVNode,
  container,
  anchor,
  parentSuspense,
  namespace,
  optimized,
) => {
  // ==========  1  ==========
  const componentUpdateFn = () => {
    if (!instance.isMounted) {
      // =====  =====
      // ...
    } else {
      // =====  =====
      // ...
    }
  }
  // ==========  2  ReactiveEffect ==========
  const effect = (instance.effect = new ReactiveEffect(
    componentUpdateFn,
    () => queueJob(instance.update),  //
    instance.scope,                    //
  ))
  // ==========  3  update  ==========
  instance.update = effect.run.bind(effect)
  // ==========  4  ==========
  effect.run()
}
```
###  1  componentUpdateFn
componentUpdateFn
---
##
```mermaid
graph TD
    A["componentUpdateFn()"] -->|| B{instance.isMounted?}
    B -->|false| C[""]
    C -->|1| D["beforeMount "]
    D -->|2| E["renderComponentRoot()"]
    E -->|3| F["patch subTree"]
    F -->|4| G["mounted "]
    G -->|5| H[" isMounted = true"]
```
###
```typescript
if (!instance.isMounted) {
  let vnodeHook: VNodeHook | null | undefined
  const { el, props } = initialVNode
  const { bm, m, parent, root, type } = instance
  // =====  1:  =====
  toggleRecurse(instance, false)
  // =====  2: beforeMount  =====
  if (bm) {
    invokeArrayFns(bm)
  }
  // =====  3: onVnodeBeforeMount  =====
  if (
    !isAsyncWrapperVNode &&
    (vnodeHook = props && props.onVnodeBeforeMount)
  ) {
    invokeVNodeHook(vnodeHook, parent, initialVNode)
  }
  // =====  4:  =====
  toggleRecurse(instance, true)
  // =====  5:  =====
  if (el && hydrateNode) {
    // SSR
    const hydrateSubTree = () => {
      instance.subTree = renderComponentRoot(instance)
      hydrateNode!(el as Node, instance.subTree, instance, parentSuspense, null)
    }
    if (isAsyncWrapperVNode && (type as ComponentOptions).__asyncHydrate) {
      ;(type as ComponentOptions).__asyncHydrate!(
        el as Element,
        instance,
        hydrateSubTree,
      )
    } else {
      hydrateSubTree()
    }
  } else {
    // =====  6:  =====
    const subTree = (instance.subTree = renderComponentRoot(instance))
    // =====  7: patch  =====
    patch(
      null,
      subTree,
      container,
      anchor,
      instance,
      parentSuspense,
      namespace,
    )
    // =====  8:  VNode  =====
    initialVNode.el = subTree.el
  }
  // =====  9: mounted  =====
  if (m) {
    queuePostRenderEffect(m, parentSuspense)
  }
  // =====  10: onVnodeMounted  =====
  if (vnodeHook = props && props.onVnodeMounted) {
    queuePostRenderEffect(
      () => invokeVNodeHook(vnodeHook!, parent, initialVNode),
      parentSuspense,
    )
  }
  // =====  11: KeepAlive activated  =====
  if (
    initialVNode.shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE ||
    (parent && isAsyncWrapper(parent.vnode) &&
     parent.vnode.shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE)
  ) {
    instance.a && queuePostRenderEffect(instance.a, parentSuspense)
  }
  // =====  12:  =====
  instance.isMounted = true
  // =====  13: Devtools  =====
  if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
    devtoolsComponentAdded(instance)
  }
  // =====  14:  =====
  initialVNode = container = anchor = null as any
}
```
###
```mermaid
graph TD
    A["beforeMount"] -->|| B["renderComponentRoot"]
    B -->| vnode| C["patch subTree"]
    C -->| DOM| D[""]
    D -->|| E["mounted"]
    style A fill:#ffcccc
    style E fill:#ccffcc
```
---
##
```typescript
else {
  // =====  =====
  let { next, bu, u, parent, vnode } = instance
  // =====  =====
  if (__FEATURE_SUSPENSE__) {
    const nonHydratedAsyncRoot = locateNonHydratedAsyncRoot(instance)
    if (nonHydratedAsyncRoot) {
      if (next) {
        next.el = vnode.el
        updateComponentPreRender(instance, next, optimized)
      }
      //
      nonHydratedAsyncRoot.asyncDep!.then(() => {
        if (!instance.isUnmounted) {
          componentUpdateFn()
        }
      })
      return
    }
  }
  // =====  1:  next =====
  let originNext = next
  // =====  2: beforeUpdate  =====
  toggleRecurse(instance, false)
  if (next) {
    next.el = vnode.el
    updateComponentPreRender(instance, next, optimized)
  } else {
    next = vnode
  }
  toggleRecurse(instance, true)
  // =====  3:  =====
  const prevTree = instance.subTree
  const nextTree = (instance.subTree = renderComponentRoot(instance))
  // =====  4: beforeUpdate  =====
  if (bu) {
    invokeArrayFns(bu)
  }
  // =====  5: patch  =====
  patch(
    prevTree,
    nextTree,
    // ...
  )
  // =====  6:  el =====
  next.el = nextTree.el
  if (originNext === null) {
    updateHOCHostEl(instance, nextTree.el)
  }
  // =====  7: updated  =====
  if (u) {
    queuePostRenderEffect(u, parentSuspense)
  }
}
```
---
##  ReactiveEffect
### ReactiveEffect
```typescript
const effect = new ReactiveEffect(
  fn,                           // componentUpdateFn
  scheduler,                    //
  scope,                        //
)
```
###
```mermaid
graph TD
    A["effect.run()"] -->|| B["componentUpdateFn()"]
    B -->|| C["renderComponentRoot()"]
    C -->| render| D[" this.count"]
    D -->| getter| E["Track()"]
    E -->|| F["targetMap.get(target)")
    F -->|get deps| G["depsMap.get(key)"]
    G -->|add effect| H["deps.add(effect)"]
    H -->|| I["count ↔ effect "]
```
###
```mermaid
graph TD
    A[" count.value"] -->| setter| B["Trigger()"]
    B -->|| C["targetMap.get(target)"]
    C -->|get effects| D["depsMap.get(key)"]
    D -->|| E[" effects"]
    E -->|| F["scheduler(effect)"]
    E -->|| G["effect.run()"]
    F -->|queueJob| H[""]
    G -->|| I[""]
    H -->|| J[""]
```
---
##  scheduler
###
```typescript
//
() => queueJob(instance.update)
//
// 1.
// 2.
// 3.
```
###
```mermaid
graph TD
    A[" 1"] -->|queue| B[""]
    C[" 2"] -->|queue| B
    D[" 3"] -->|queue| B
    B -->|| E["flush queue"]
    E -->|| F["instance.update()"]
    Note["3  = 1  update"]
```
###
```typescript
// queueJob
const queue: SchedulerJob[] = []
function queueJob(job: SchedulerJob) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  //  job
}
```
---
##  EffectScope
### EffectScope
```typescript
scope: new EffectScope(true /* detached */)
//  scope
// -  scope
// -  scope.stop()
// -  scope  effects
```
###
```typescript
// unmount
instance.scope.stop()
//
// 1.  effects
// 2.  watchers
// 3.
// 4.
```
---
##
```mermaid
graph LR
    subgraph ""
    A["ref/reactive"]
    end
    subgraph ""
    B["setter "]
    C["Trigger "]
    end
    subgraph ""
    D["scheduler"]
    E[""]
    end
    subgraph ""
    F["componentUpdateFn"]
    G["renderComponentRoot"]
    H["patch"]
    end
    subgraph ""
    I["effect.run"]
    J["Track "]
    K["targetMap"]
    end
    A -->|| B
    B -->|| C
    C -->|| D
    D -->|| E
    E -->|| F
    F -->|| G
    G -->|| I
    I -->|| J
    J -->|| K
    K -->|| C
```
---
##
### 1.
```typescript
//
count.value++
message.value = 'new'
flag.value = true
//  componentUpdateFn
// vs
await nextTick()
count.value++
await nextTick()  //
message.value = 'new'
```
### 2.
```typescript
//  effect
for (let i = 0; i < 1000; i++) {
  count.value++
}
//  update
```
### 3.
```typescript
//  effects
//  effects
//
```
---
##
```mermaid
graph TD
    A["mount() "] -->|| B["ComponentInternalInstance"]
    B -->|| C["setupComponent()"]
    C -->|| D["setup()"]
    D -->|| E[""]
    E -->|| F["setupRenderEffect()"]
    F -->|| G["ReactiveEffect"]
    G -->|| H["componentUpdateFn()"]
    H -->|| I["Track()"]
    I -->|| J["targetMap"]
    J -->|| K[" "]
    K -->|| L[""]
    L -->|| M["setter"]
    M -->|| N["Trigger()"]
    N -->|| O["scheduler"]
    O -->|| P[""]
    P -->|| Q["componentUpdateFn()"]
    Q -->|| R[" vnode"]
    R -->|| S["patch()"]
    S -->| DOM| T[""]
```
---
##
- [](./1-3-component-init.md) -
- [setup ](./1-4-setup.md) -  setup()
- [mount  render](./1-2-mount.md) -  setupRenderEffect
- [](./1-1-overview.md) -
